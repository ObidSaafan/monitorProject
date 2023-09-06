import express, { Router } from "express";
import asyncHandler from "express-async-handler";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import { PrismaClient, user } from "@prisma/client";
import bcrypt from "bcryptjs";
import authenticateToken from "../middleware/authentication";
import { generateTokenResponse } from "../middleware/authentication";

const prisma = new PrismaClient();

const router = Router();

async function login(req: express.Request, res: express.Response) {
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
      token: generateTokenResponse(user),
    });
    res.send();
  } else {
    res.status(HTTP_BAD_REQUEST).send("Email or Password is invalid");
  }
}

async function updateinformation(req: express.Request, res: express.Response) {
  const { firstname, lastname, Password } = req.body;
  const userId = req.user?.id; // Get the user's ID from the authenticated user

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: User ID is missing." });
  }
  //TODO: not sure if i need to remove this, its a search, but isnt it already gonna search again to update the record so what is the point here?
  //! need to test
  // const user = await prisma.user.findUnique({
  //   where: {
  //     iduser: userId,
  //   },
  // });

  if (!Password) {
    res.status(HTTP_BAD_REQUEST).send("missing password");
  }
  const encryptedPassword = await bcrypt.hash(Password, 10);

  const newUser: user = await prisma.user.update({
    where: { iduser: userId },
    data: {
      firstname: firstname,
      lastname: lastname,
      password: encryptedPassword,
      firstlogin: false,
    },
  });
  res.send(generateTokenResponse(newUser));
}
//TODO: maybe create a forgot password?

async function addUser(req: any, res: any) {
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

router.post("/login", asyncHandler(login));

router.use(authenticateToken);
router.post("/update", asyncHandler(updateinformation));
router.post("/addUser", asyncHandler(addUser));

export default router;
