import express from "express";
import { HTTP_BAD_REQUEST } from "../../constants/http_status";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function addClient(req: express.Request, res: express.Response) {
  const userRole = req.user?.role;
  if (userRole !== "1") {
    res
      .status(403)
      .json({ error: "Forbidden: User does not have permission." });
    return;
  }
  const { clientName } = req.body;

  try {
    // Check if the client exists
    const existingClient = await prisma.client.findUnique({
      where: {
        clientname: clientName,
      },
    });

    if (existingClient) {
      res.status(HTTP_BAD_REQUEST).send("Client Already Exists");
      return;
    }
    // Add a new client if it doesn't exist
    await prisma.client.create({
      data: {
        clientname: clientName.toLowerCase(),
      },
    });
    res.status(200).send("Client Created successfully");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}
export async function addClientPM(req: express.Request, res: express.Response) {
  const userRole = req.user?.role;
  const { clientName, pmEmail, pmName } = req.body;
  if (userRole !== "1") {
    res
      .status(403)
      .json({ error: "Forbidden: User does not have permission." });
    return;
  }
  try {
    // Check if the project manager exists
    const existingPM = await prisma.clientpm.findFirst({
      where: {
        email: pmEmail,
      },
    });
    if (existingPM) {
      res.status(HTTP_BAD_REQUEST).send("Project Manager Already Exists");
      return;
    }
    const pm = await prisma.clientpm.create({
      data: {
        email: pmEmail,
        name: pmName,
        company: { connect: { clientname: clientName } },
      },
    });
    res.send({
      message: "Project Manager added successfully.",
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}
export async function removeClientPM(
  req: express.Request,
  res: express.Response
) {
  const userRole = req.user?.role;
  const { clientName, pmEmail, pmName } = req.body;
  if (userRole !== "1") {
    res
      .status(403)
      .json({ error: "Forbidden: User does not have permission." });
    return;
  }
  try {
    // Check if the project manager exists
    const existingPM = await prisma.clientpm.findFirst({
      where: {
        email: pmEmail,
      },
    });
    if (!existingPM) {
      res.status(HTTP_BAD_REQUEST).send("Project Manager Doesnt Exists");
      return;
    }
    await prisma.clientpm.delete({
      where: {
        email: pmEmail,
      },
    });
    res.send({
      message: "Project Manager Deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}
export async function getClients(req: express.Request, res: express.Response) {
  try {
    const Clients = await prisma.client.findMany({
      include: { clientpm: true },
    });
    res.send(Clients);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
export async function getClientInformation(
  req: express.Request,
  res: express.Response
) {
  const clients = await prisma.client.findMany({
    select: { clientid: true, clientname: true, clientpm: true },
  });
  res.send(
    clients.map((client) => {
      return {
        clientid: client.clientid,
        clientname: client.clientname,
        pms: client.clientpm,
      };
    })
  );
}
