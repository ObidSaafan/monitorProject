import { Router } from "express";
import asyncHandler from "express-async-handler";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import {
  allowedProjectTypes,
  allowedProjectStatuses,
  allowedContractStatuses,
  allowedCurrencies,
} from "../constants/allowed_types";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authentication";

const bodyParser = require("body-parser");

const prisma = new PrismaClient();
const router = Router();

router.use(authenticateToken);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      include: { Sprojectmanager: true },
    });

    const projectsWithCompletion = await Promise.all(
      projects.map(async (project) => {
        const latestRevenue = await prisma.revenuerecognized.findFirst({
          where: { idproject: project.idproject },
          orderBy: { date: "desc" },
        });

        const contractValue = project.contractvalue;
        const completion = latestRevenue
          ? (latestRevenue.value / contractValue) * 100
          : 0; // Default to 0 if no revenue recognized entry found

        const projectManager = project.Sprojectmanager;

        return {
          id: project.idproject,
          projectname: project.projectname,
          projectstatus: project.projectstatus,
          projectmanager: projectManager
            ? projectManager.firstname + " " + projectManager.lastname
            : null,
          contract: contractValue,
          currency: project.currency,
          completion: completion,
        };
      })
    );

    res.json(projectsWithCompletion);
  })
);

router.get(
  "/projectType/:projectType/date/:date/clientName/:clientName",
  async (req, res) => {
    const { projectType, date, clientName } = req.params;
    const userId = req.user?.id;

    try {
      const project = await prisma.project.findUnique({
        where: { idproject: `${projectType}/${date}/${clientName}` },
        include: {
          paymentmilestone: true, // Include related data from paymentmilestone table
          revenuerecognized: true, // Include related data from revenuerecognized table
          budgetedcost: true, // Include related data from budgetedcost table
          actualspend: true, // Include related data from actualspend table
        },
      });

      if (!project) {
        return res.status(404).send("Not Found");
      }
      const updaterequest = await prisma.updateapproval.findUnique({
        where: { id: project.idproject },
      });
      if (
        !userId ||
        (userId !== updaterequest?.administrator &&
          userId !== updaterequest?.ucreator)
      ) {
        return res.status(401).json({
          error: "Unauthorized: User ID is missing or not authorized.",
        });
      }
      res.json({ success: true, project, updaterequest });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching data." });
    }
  }
);

router.get("/information", async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        clientpm: true, // Include the project managers associated with each client
      },
    });

    const clientsdata = clients.map((client) => {
      return {
        clientid: client.clientid,
        clientname: client.clientname,
        pms: client.clientpm, // The associated project managers are already included by Prisma
      };
    });
    const pms = await prisma.user.findMany({
      where: {
        roleid: "2",
      },
    });

    //?: do we need this?
    const dropdownOptions = {
      contractStatuses: allowedContractStatuses,
      projectStatuses: allowedProjectStatuses,
      projectTypes: allowedProjectTypes,
      currencies: allowedCurrencies,
    };

    // Send both dropdownOptions and dataToSend in the response
    res.json({ dropdownOptions, clientsdata, pms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(
  "/search/:searchTerm",
  asyncHandler(async (req, res) => {
    const searchTerm = req.params.searchTerm;
    const matchingProjects = await prisma.project.findMany({
      where: {
        projectname: {
          contains: searchTerm,
        },
      },
      include: { Sprojectmanager: true },
    });
    const projectsWithCompletion = await Promise.all(
      matchingProjects.map(async (project) => {
        const latestRevenue = await prisma.revenuerecognized.findFirst({
          where: { idproject: project.idproject },
          orderBy: { date: "desc" },
        });

        const contractValue = project.contractvalue;
        const completion = latestRevenue
          ? (latestRevenue.value / contractValue) * 100
          : 0; // Default to 0 if no revenue recognized entry found

        const projectManager = project.Sprojectmanager;

        return {
          id: project.idproject,
          projectname: project.projectname,
          projectstatus: project.projectstatus,
          projectmanager: projectManager
            ? projectManager.firstname + " " + projectManager.lastname
            : null,
          contract: contractValue,
          currency: project.currency,
          completion: completion,
        };
      })
    );

    res.json(projectsWithCompletion);
  })
);

router.use(bodyParser.json()); //todo check if removeable

router.post("/validate25", (req, res) => {
  const { contractStatus } = req.body;

  if (!allowedContractStatuses.includes(contractStatus)) {
    return res.status(400).json({ error: "Invalid contract status." });
  }

  res.json({ success: true });
});

router.post("/validate50", (req, res) => {
  const { projectStatus, projectType } = req.body;

  if (!allowedProjectStatuses.includes(projectStatus)) {
    return res.status(400).json({ error: "Invalid project status." });
  }
  if (!allowedProjectTypes.includes(projectType)) {
    return res.status(400).json({ error: "Invalid project type." });
  }

  res.json({ success: true });
});

router.post("/validate75", (req, res) => {
  const { Currency, paymentMilestones } = req.body;

  if (!allowedCurrencies.includes(Currency)) {
    return res.status(400).json({ error: "Invalid currency." });
  }

  // Calculate the total sum of payment terms dynamically
  const totalPaymentTerms = paymentMilestones.reduce(
    (sum: number, term: { value: number }) => sum + term.value,
    0
  );

  if (totalPaymentTerms !== 100) {
    return res.status(400).json({ error: "Invalid payment terms total." });
  }

  res.json({ success: true });
});

router.post(
  "/create",
  asyncHandler(async (req, res) => {
    const {
      projectName,
      Description,
      projectType,
      projectStatus,
      //      projectStartDate,
      durationOfProject,
      plannedCompletionDate,
      Currency,
      contractValue,
      contractStatus,
      referenceNumber,
      expectedProfit,
      actualProfit,
      projectmanager,
      clientName,
      paymentMilestones,
      budgetedcosts,
      projectmanagerclient,
    } = req.body;

    let project;
    if (projectName) {
      project = await prisma.project.findFirst({
        where: {
          projectname: projectName,
        },
      });
    }

    if (project) {
      res.status(HTTP_BAD_REQUEST).send("Project already exists!");
      return;
    }

    // paymentmilestoneValue,paymentmilestoneDesc

    let client;
    if (clientName) {
      client = await prisma.client.findUnique({
        where: {
          clientname: clientName,
        },
      });
    }

    if (!client) {
      // Handle the case where the client doesn't exist
      res.status(HTTP_BAD_REQUEST).send("Client does not exist.");
      return;
    }

    let pm;
    if (projectmanager) {
      pm = await prisma.user.findFirst({
        where: {
          email: projectmanager,
        },
      });
    }

    if (!pm) {
      // Handle the case where the project manager doesn't exist
      res.status(HTTP_BAD_REQUEST).send("Project manager does not exist.");
      return;
    }

    let cpm;
    if (projectmanagerclient) {
      cpm = await prisma.clientpm.findFirst({
        where: {
          email: projectmanagerclient,
        },
      });
    }

    if (!cpm) {
      // Handle the case where the client pm doesn't exist
      res.status(HTTP_BAD_REQUEST).send("Client pm does not exist.");
      return;
    }

    // add default Date
    const projectStartDate = new Date();

    try {
      const newProject = await prisma.project.create({
        data: {
          idproject:
            projectType +
            "/" +
            projectStartDate.toISOString() +
            "/" +
            client.clientname, // Use client.clientid
          projectname: projectName,
          description: Description,
          projecttype: projectType,
          projectstatus: projectStatus,
          projectstartdate: projectStartDate,
          durationOfproject: durationOfProject,
          plannedcompletiondate: plannedCompletionDate,
          currency: Currency,
          contractvalue: contractValue,
          contractstatus: contractStatus,
          referencenumber: referenceNumber,
          expectedprofit: expectedProfit,
          actualprofit: actualProfit,
          projectmanager: pm.iduser,
          clientpmid: cpm.clientpmid,
          clientid: client.clientid, // Use client.clientid
          paymentmilestone: {
            create: paymentMilestones.map(
              (milestone: { text: string; value: number }) => ({
                milestonetext: milestone.text,
                milestonevalue: milestone.value,
              })
            ),
          },
          budgetedcost: {
            create: budgetedcosts.map(
              (cost: { text: string; value: number }) => ({
                source: cost.text,
                value: cost.value,
              })
            ),
          },
        },
      });

      res.status(201).send(newProject);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
);

router.post(
  "/update/projectType/:projectType/date/:date/clientName/:clientName",
  async (req, res) => {
    //try {
    const { information } = req.body; // Use the received draftid
    const userId = req.user?.id;
    const { projectType, date, clientName } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    try {
      const project = await prisma.project.findUnique({
        where: { idproject: `${projectType}/${date}/${clientName}` },
      });

      if (!project) {
        return res.status(404).send("Not Found");
      }

      const {
        revenuerecognized,
        actualProfit,
        actualspend,
        invoice,
        budgetedcost,
        // ... add other properties as needed
      } = information;
      const draftJson = {
        revenuerecognized,
        actualProfit,
        actualspend,
        invoice,
        budgetedcost,
        // ... add other properties as needed
      };
      // Convert the draft object to a JSON string
      const draftJsonString = JSON.stringify(draftJson);

      // Update existing draft
      const updatedDraft = await prisma.updateapproval.create({
        data: {
          id: project.idproject,
          information: draftJsonString,
          ucreator: userId,
          administrator: project.projectmanager,
          approval: "Not_Approved",
        },
      });

      //TODO approval system still need to be implemented as in sending admin notification and they can approve or not and add comment and the approval removal fix thingy
      res.json({ success: true, draft: updatedDraft });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred" });
    }
  }
);

export default router;

/*
[
  {
    id: 'project_name',
    rule: 'r/wr',
    permission: 'projectNameRead',
    status: project.status,
    type: project.type,
    preconditionn: precon
  },
  {
    id: 'project_name',
    rule: 'wr',
    permission: 'projectNameRead',
    status: project.status,
    type: project.type
  }
] */
