import { PrismaClient } from "@prisma/client";
import express, { Router } from "express";
import asyncHandler from "express-async-handler";

const router = Router();
const prisma = new PrismaClient();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log("caught");
    const results = await prisma.role.findMany({
      where: {
        permissions: {
          contains: "Test",
        },
      },
    });
    res.json(results);
  })
);
export default router;
