const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export const redirectUriFor = (provider) =>
  `${BASE_URL}/auth/${provider}/callback`;

export const providers = {
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    async getProfile(accessToken) {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Batcave-App", // GitHub exige un User-Agent
        Accept: "application/vnd.github+json",
      };
      const user = await fetch("https://api.github.com/user", { headers }).then(
        (r) => r.json(),
      );

      let email = user.email;
      if (!email) {
        const emails = await fetch("https://api.github.com/user/emails", {
          headers,
        }).then((r) => r.json());
        const primary = Array.isArray(emails)
          ? emails.find((e) => e.primary && e.verified)
          : null;
        email = primary ? primary.email : null;
      }

      return { providerId: String(user.id), username: user.login, email };
    },
  },

  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    async getProfile(accessToken) {
      const info = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ).then((r) => r.json());
      return {
        providerId: info.sub,
        username: info.name || info.email,
        email: info.email || null,
      };
    },
  },

  facebook: {
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scope: "email public_profile",
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    async getProfile(accessToken) {
      const info = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
      ).then((r) => r.json());
      return {
        providerId: info.id,
        username: info.name,
        email: info.email || null,
      };
    },
  },
};
