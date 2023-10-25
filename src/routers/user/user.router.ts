import { Router } from "express";
import asyncHandler from "express-async-handler";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../../middleware/authentication";
import { addUser, login, updateinformation } from "./user.services";

const prisma = new PrismaClient();

const router = Router();

router.post("/login", asyncHandler(login));

router.use(authenticateToken);
router.post("/update", asyncHandler(updateinformation));
router.post("/addUser", asyncHandler(addUser));

export default router;
