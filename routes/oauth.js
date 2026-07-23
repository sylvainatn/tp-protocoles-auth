import { Router } from "express";
import crypto from "crypto";
import db from "../config/db.js";
import { issueSession } from "../config/session.js";
import { providers, redirectUriFor } from "../config/oauthProviders.js";

const oauthRoutes = Router();

const flowCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 10 * 60 * 1000,
  path: "/",
};

oauthRoutes.get("/:provider", (req, res) => {
  const name = req.params.provider;
  const provider = providers[name];

  if (!provider) {
    return res.status(404).send("Fournisseur d'identité inconnu.");
  }
  if (!provider.clientId) {
    return res.redirect(
      `/oauth-error.html?error=not_configured&provider=${name}`,
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  res.cookie("oauth_state", state, flowCookieOptions);
  res.cookie("oauth_verifier", codeVerifier, flowCookieOptions);

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUriFor(name),
    response_type: "code",
    scope: provider.scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return res.redirect(`${provider.authorizeUrl}?${params.toString()}`);
});

oauthRoutes.get("/:provider/callback", async (req, res) => {
  const name = req.params.provider;
  const provider = providers[name];

  if (!provider) {
    return res.status(404).send("Fournisseur d'identité inconnu.");
  }

  if (req.query.error) {
    return res.redirect(
      `/oauth-error.html?error=${encodeURIComponent(req.query.error)}`,
    );
  }

  const { code, state } = req.query;
  const savedState = req.cookies?.oauth_state;
  const codeVerifier = req.cookies?.oauth_verifier;

  // Vérification anti-CSRF : le state doit correspondre à celui déposé.
  if (!code || !state || state !== savedState) {
    return res.redirect("/oauth-error.html?error=invalid_state");
  }

  res.clearCookie("oauth_state");
  res.clearCookie("oauth_verifier");

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      redirect_uri: redirectUriFor(name),
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("[oauth] échec échange token:", tokenData);
      return res.redirect("/oauth-error.html?error=token_exchange_failed");
    }

    // Récupération du profil (endpoint userinfo propre au fournisseur).
    const profile = await provider.getProfile(tokenData.access_token);

    // Upsert : l'identité est le COUPLE (provider, provider_id).
    db.prepare(
      `INSERT INTO users (provider, provider_id, username, email)
       VALUES (@provider, @providerId, @username, @email)
       ON CONFLICT(provider, provider_id)
       DO UPDATE SET username = excluded.username, email = excluded.email`,
    ).run({
      provider: name,
      providerId: profile.providerId,
      username: profile.username,
      email: profile.email,
    });

    const user = db
      .prepare(
        "SELECT id, username FROM users WHERE provider = ? AND provider_id = ?",
      )
      .get(name, profile.providerId);

    // On délivre NOTRE session applicative (mêmes cookies JWT que le login classique).
    issueSession(res, user);
    return res.redirect("/bat-computer");
  } catch (err) {
    console.error("[oauth] erreur callback:", err);
    return res.redirect("/oauth-error.html?error=server_error");
  }
});

export default oauthRoutes;
