import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import apiAuthRoutes from "./routes/apiAuth.js";
import userRoutes from "./routes/user.js";
import twoFactorRoutes from "./routes/twoFactor.js";
import oauthRoutes from "./routes/oauth.js";
import batcomputerRoutes from "./routes/batcomputer.js";
import "./config/db.js";

const app = express();
const PORT = process.env.PORT;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "upgrade-insecure-requests": null,
      },
    },
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static("public"));

app.use("/auth", authRoutes);
app.use("/auth", oauthRoutes); // après authRoutes : /auth/login n'est pas capturé par /auth/:provider
app.use("/api/auth", apiAuthRoutes);
app.use("/api/user", userRoutes);
app.use("/api", twoFactorRoutes);
app.use(batcomputerRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
