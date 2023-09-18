import express from "express";
import userRouter from "./routers/user.router";
import testRouter from "./routers/test.router";
import projectRouter from "./routers/project.router";
import clientRouter from "./routers/client.router";
import draftRouter from "./routers/draft.router";
import reportRouter from "./routers/report.router";
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
app.use("/api/reports", reportRouter);
app.use("/test", testRouter);
