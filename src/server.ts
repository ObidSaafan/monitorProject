import express from "express";
import cors from "cors";
import userRouter from "./routers/user.router";
import projectRouter from "./routers/project.router";
import clientRouter from "./routers/client.router";
import draftRouter from "./routers/draft.router";
import dotenv from "dotenv";

dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const app = express();
const port = 4001;
app.listen(port, () => {
  console.log("website served on http://localhost:" + port);
});
app.use(express.json());

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:4200"], //4200 for angular app
  })
);

app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/clients", clientRouter);
app.use("/api/drafts", draftRouter);
