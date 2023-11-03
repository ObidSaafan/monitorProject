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
  const { clientName, pmName, pmEmail } = req.body;

  try {
    // Check if the client exists
    const existingClient = await prisma.client.findUnique({
      where: {
        clientname: clientName,
      },
    });

    let clientId;

    if (existingClient) {
      clientId = existingClient.clientid; // Use the existing client's ID
    } else {
      // Add a new client if it doesn't exist
      const newClient = await prisma.client.create({
        data: {
          clientname: clientName.toLowerCase(),
        },
      });

      clientId = newClient.clientid;
    }

    // Check if the project manager exists
    const existingPM = await prisma.clientpm.findFirst({
      where: {
        email: pmEmail,
      },
    });

    if (existingPM) {
      // Project manager already exists for some client
      if (existingPM.clientid !== clientId) {
        // If the existing project manager belongs to a different client, return an error
        res
          .status(HTTP_BAD_REQUEST)
          .send("Project manager already exists for a different client.");
        return;
      }
      // Otherwise, it's an existing project manager associated with the same client.
      // You can choose to update the project manager details here if needed.
      res.send({ message: "Project Manager already exists for the client." });
      return;
    }

    // Add a new project manager associated with the client (either existing or newly created)
    const newPM = await prisma.clientpm.create({
      // TODO: test the remove the newPM
      data: {
        name: pmName.toLowerCase(),
        email: pmEmail.toLowerCase(),
        clientid: clientId, // Use the client ID (either existing or newly created)
      },
    });

    res.send({
      message: "Client and/or Project Manager added successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
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
  res.send(clients);
}
