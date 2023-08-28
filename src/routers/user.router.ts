import { Router } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import { PrismaClient, user } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateTokenResponse } from "../middleware/authentication";

const prisma = new PrismaClient();

const router = Router();

async function login(req: any, res: any) {
  const { Email, Password } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email: Email,
    },
  });
  //look using mysql in db for username and password maybe need orm or keep rawdata
  if (user && (await bcrypt.compare(Password, user.password))) {
    res.send(generateTokenResponse(user));
  } else {
    res.status(HTTP_BAD_REQUEST).send("Email or Password is invalid");
  }
}

async function register(req: any, res: any) {
  const { firstname, lastname, Email, Password } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email: Email,
    },
  });
  if (user) {
    res.status(HTTP_BAD_REQUEST).send("User already exists, please login!");
    return;
  }

  const encryptedPassword = await bcrypt.hash(Password, 10);

  // TODO: add Role ID integration with invites
  const newUser: user = await prisma.user.create({
    data: {
      firstname,
      lastname,
      email: Email.toLowerCase(),
      password: encryptedPassword,
      roleid: "2",
    },
  });
  res.send(generateTokenResponse(newUser));
}

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(register));

export default router;
