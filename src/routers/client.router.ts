import { Router } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import { PrismaClient, client, clientpm } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

// so they can add a new client on their own later, + needed this to make it easier to create a project since there is a foriegn key
//make a client pm add
/////////////////////////////

/*
router.get('/clientNmanagers', asyncHandler(
  async (req, res) => {
    const clients = await prisma.client.findMany()
    const clientpms = await prisma.$queryRaw`
      SELECT
        clientpmid,name,email
      FROM
        client,clientpm
      where client.clientid=clientpm.clientid;`
    // the const ontop of this is just query to get the pms raw
    const pms = await prisma.clientpm.findMany()
    const dataToSend = clients.map((client) => {
      return {
        clientid: client.clientid,
        clientname: client.clientname,
        pms: pms.filter((pm) => pm.clientid === client.clientid),
      };
    });
  res.send(dataToSend);
} catch (err) {
  // Handle errors appropriately
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}
  ));
*/

/*router.get('/clientNmanagers', asyncHandler(async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        clientpm: true, // Include the project managers associated with each client
      },
    });

    const dataToSend = clients.map((client) => {
      return {
        clientid: client.clientid,
        clientname: client.clientname,
        pms: client.clientpm, // The associated project managers are already included by Prisma
      };
    });

    res.send(dataToSend);
  } catch (err) {
    // Handle errors appropriately
    console.error(err);
    res.status(500)
    .send('Internal Server Error');
  }}));
*/

///////////////////////////////////////////////////////////////////
/*router.post('/add', asyncHandler(
    async (req, res) => {
      const {clientName} = req.body;
      const client = await prisma.client.findUnique({
        where:{
            clientname:clientName,
        }});
      if(client){
        res.status(HTTP_BAD_REQUEST)
        .send('client already exist!');
        return;
      }
  
      const newClient: client = await prisma.client.create({
        data:{
        clientname:clientName.toLowerCase()
        // add pm here 
        },
      },
    )
    const {pmName,pmEmail} = req.body;
    const pm = await prisma.clientpm.findFirst({
      where:{
          email:pmEmail
      }});
    if(pm){
      res.status(HTTP_BAD_REQUEST)
      .send('client pm already exist! if not, please recheck the information and try again');
      return;
    }

    const newPM: clientpm = await prisma.clientpm.create({
      data:{
          name:pmName.toLowerCase(),
          email:pmEmail.toLowerCase(),
          clientid:clientName.toLowerCase(),
      },
    },
  )
  
    res.send(newClient);
  }
));
*/
router.post(
  "/add",
  asyncHandler(async (req, res) => {
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
  })
);

//
// we can have this approach or the other one were we make all in the same request, other approach send client and pms in the company
/*
router.get('/getpm', asyncHandler(
  async (req, res) => {
    const {clientName} = req.body;
    const clientpms = await prisma.$queryRaw`
      SELECT
        name,email
      FROM
        clientpm
      where clientid= (select clientid from client where clientname =${clientName});`
      res.send(clientpms);
    }
));
*/
/*
router.post('/addpm', asyncHandler(
  async (req, res) => {
    const {pmName,pmEmail,company} = req.body;
    const pm = await prisma.clientpm.findFirst({
      where:{
          email:pmEmail
      }});
    if(pm){
      res.status(HTTP_BAD_REQUEST)
      .send('client pm already exist! if not, please recheck the information and try again');
      return;
    }

    const newPM: clientpm = await prisma.clientpm.create({
      data:{
          name:pmName.toLowerCase(),
          email:pmEmail.toLowerCase(),
          clientid:company
      },
    },
  )
  res.send(newPM);
}
));*/

const generateTokenReponse = (client: client) => {
  const token = jwt.sign(
    {
      clientname: client.clientname,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "30d",
    }
  );

  return {
    clientname: client.clientname,
    token: token,
  };
};

export default router;
