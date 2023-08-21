import { Router } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import { PrismaClient, user } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { Email, Password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email: Email,
      },
      select: {
        //TODO: delete this
        iduser: true,
        email: true,
        password: true,
        firstname: true,
        lastname: true,
        roleid: true,
      },
    });
    //look using mysql in db for username and password maybe need orm or keep rawdata
    if (user && (await bcrypt.compare(Password, user.password))) {
      res.send(generateTokenReponse(user));
    } else {
      res.status(HTTP_BAD_REQUEST).send("Email or Password is invalid");
    }
  })
);

router.post(
  "/register",
  asyncHandler(async (req, res) => {
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
    res.send(generateTokenReponse(newUser));
  })
);

const generateTokenReponse = (user: user) => {
  const token = jwt.sign(
    {
      id: user.iduser,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.roleid,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "30d", // TODO: Consider a shorter expiration time
    }
  );

  return {
    id: user.iduser,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.roleid,
    token: token,
  };
};

export default router;
