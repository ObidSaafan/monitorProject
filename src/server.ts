import express from "express";
import userRouter from "./routers/user/user.router";
import projectRouter from "./routers/project/project.router";
import clientRouter from "./routers/client/client.router";
import draftRouter from "./routers/draft/draft.router";
import dotenv from "dotenv";

dotenv.config();
import { PrismaClient } from "@prisma/client";
import cors from "cors";
const prisma = new PrismaClient();

const app = express();
const port = 4001;
app.listen(port, () => {
  console.log("website served on http://localhost:" + port);
});

app.use(express.json());
app.use(cors());

app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/clients", clientRouter);
app.use("/api/drafts", draftRouter);
