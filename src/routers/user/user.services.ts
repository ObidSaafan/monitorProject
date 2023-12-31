import express from "express";
import { HTTP_BAD_REQUEST } from "../../constants/http_status";
import { PrismaClient, user } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateTokenResponse } from "../../middleware/authentication";

const prisma = new PrismaClient();

export async function login(req: express.Request, res: express.Response) {
  const { Email, Password } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email: Email,
    },
  });
  //look using mysql in db for username and password maybe need orm or keep rawdata
  if (user && (await bcrypt.compare(Password, user.password))) {
    res.send({
      firstLogin: user.firstlogin,
      user: generateTokenResponse(user),
    });
    res.send();
  } else {
    res.status(HTTP_BAD_REQUEST).send("Email or Password is invalid");
  }
}

export async function updateinformation(
  req: express.Request,
  res: express.Response
) {
  const { firstname, lastname, password } = req.body;
  const userId = req.user?.id; // Get the user's ID from the authenticated user

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: User ID is missing." });
  }

  if (!password) {
    res.status(HTTP_BAD_REQUEST).send("missing password");
  }
  const encryptedPassword = await bcrypt.hash(password, 10);

  const newUser: user = await prisma.user.update({
    where: { iduser: userId },
    data: {
      firstname: firstname,
      lastname: lastname,
      password: encryptedPassword,
      firstlogin: false,
    },
  });
  res.send({
    firstLogin: newUser.firstlogin,
    user: generateTokenResponse(newUser),
  });
}
//TODO: maybe create a forgot password?

export async function addUser(req: any, res: any) {
  const { Email, roleid, Password } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email: Email,
    },
  });
  if (user) {
    res.status(HTTP_BAD_REQUEST).send("User already exists");
    return;
  }

  if (!Password) {
    res.status(HTTP_BAD_REQUEST).send("missing password");
  }
  const encryptedPassword = await bcrypt.hash(Password, 10);

  const newUser: user = await prisma.user.create({
    data: {
      firstname: "",
      lastname: "",
      email: Email.toLowerCase(),
      password: encryptedPassword,
      roleid: roleid,
    },
  });
  res.send("User Created");
}
