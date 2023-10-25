import { Router } from "express";
import asyncHandler from "express-async-handler";
import { addClient } from "./client.services";

const router = Router();

router.post("/add", asyncHandler(addClient));

export default router;
