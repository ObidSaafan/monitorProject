import { PrismaClient } from "@prisma/client";
import express, { Router } from "express";
import asyncHandler from "express-async-handler";

type User = {};
const user: User[] = [];

const router = Router();
const prisma = new PrismaClient();

async function getUser(req: any, res: any) {
  //perform get
  console.log("getUser");
  const id = req.params.id;
  res.send(user[id]);
}
async function createUser(req: any, res: any) {
  //perform create
  console.log("createUser");
  const id = req.params.id;
  res.send(user[id]);
}
async function updateUser(req: any, res: any) {
  //perform update
  console.log("updateUser");
  const id = req.params.id;
  res.send(user[id]);
}
async function deleteUser(req: any, res: any) {
  //perform delete
  console.log("deleteUser");
  const id = req.params.id;
  res.send(user[id]);
}

// router.get("/:id", asyncHandler(getUser));
// router.patch("/:id", asyncHandler(updateUser));
// router.post("/:id", asyncHandler(createUser));
// router.delete("/:id", asyncHandler(deleteUser));

router
  .route("/:id")
  .get(asyncHandler(getUser))
  .post(asyncHandler(createUser))
  .patch(asyncHandler(updateUser))
  .delete(asyncHandler(deleteUser));

export default router;

//Commit
