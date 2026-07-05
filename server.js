import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import authRoutes from "./routes/auth.js";
import batcomputerRoutes from "./routes/batcomputer.js";
import "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const SESSION_SECRET = process.env.SESSION_SECRET;

app.use(
  session({
    name: "bat_identity",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1800000,
    },
  }),
);

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(express.static("public"));

app.use("/auth", authRoutes);
app.use(batcomputerRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
