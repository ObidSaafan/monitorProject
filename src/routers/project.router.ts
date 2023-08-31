import express, { Router } from "express";
import asyncHandler from "express-async-handler";
import { HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED } from "../constants/http_status";
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

async function getAllProjects(req: express.Request, res: express.Response) {
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
}

async function getProject(req: express.Request, res: express.Response) {
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
      return res.status(404).send("project doesnt exist");
    }
    if (!userId || project.projectmanager !== userId) {
      return res.status(401).json({
        error: "Unauthorized: User ID is missing or not authorized.",
      });
    }
    const updaterequest = await prisma.updateapproval.findUnique({
      where: { id: project.idproject },
    });
    if (!updaterequest) {
      res.json({ success: true, project }); // Send response without updaterequest
    } else {
      if (
        //todo need testing on the update request and the full process of the get project, i did small testing n i think it works
        //todo add project completion perecentage here , make it a middleware and use it here and the get ontop for better practice
        userId !== updaterequest.administrator &&
        userId !== updaterequest.ucreator
      ) {
        return res.status(401).json({
          error: "Unauthorized: User ID is missing or not authorized.",
        });
      }
      res.json({ success: true, project, updaterequest });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
}
async function getInformation(req: express.Request, res: express.Response) {
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
}
async function searchProject(req: express.Request, res: express.Response) {
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
}

function validate25(req: express.Request, res: express.Response) {
  const { contractStatus } = req.body;

  if (!allowedContractStatuses.includes(contractStatus)) {
    return res.status(400).json({ error: "Invalid contract status." });
  }

  res.json({ success: true });
}
function validate50(req: express.Request, res: express.Response) {
  const { projectStatus, projectType } = req.body;

  if (!allowedProjectStatuses.includes(projectStatus)) {
    return res.status(400).json({ error: "Invalid project status." });
  }
  if (!allowedProjectTypes.includes(projectType)) {
    return res.status(400).json({ error: "Invalid project type." });
  }

  res.json({ success: true });
}

function validate75(req: express.Request, res: express.Response) {
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
}

async function createProject(req: express.Request, res: express.Response) {
  const {
    projectName,
    Description,
    projectType,
    projectStatus,
    //projectStartDate,
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

  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User ID is missing." });
  }

  // Check if the user has the roleid of 1 (assuming 1 is the admin role)
  if (userRole !== "1") {
    return res
      .status(403)
      .json({ error: "Forbidden: User does not have permission." });
  }

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
    pm = await prisma.user.findUnique({
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
  if (pm.roleid !== "2") {
    res
      .status(HTTP_BAD_REQUEST)
      .send("the email provided does not belong to a PM.");
    return;
  }

  let cpm;
  if (projectmanagerclient) {
    cpm = await prisma.clientpm.findUnique({
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
  if (cpm.clientid !== client.clientid) {
    res
      .status(HTTP_BAD_REQUEST)
      .send("Client pm is not associated with the provided client.");
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
}
async function updateProject(req: express.Request, res: express.Response) {
  //try {
  const { information } = req.body; // Use the received draftid
  const { projectType, date, clientName } = req.params;

  const userId = req.user?.id;
  const roleId = req.user?.role;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User ID is missing." });
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
    // const draftJsonString = JSON.stringify(draftJson); //? do we need to stringify the json?

    if (project.projectmanager === userId) {
      //PM can update project assigned to them without approval
      const updatedProject = await prisma.project.update({
        where: { idproject: project.idproject },
        data: {
          actualprofit: actualProfit,
          revenuerecognized: { create: revenuerecognized },
          actualspend: { create: actualspend },
          invoice: { create: invoice },
          budgetedcost: { create: budgetedcost },
        },
      });
      res.json({ success: true, updatedProject });
    } else if (roleId === "1") {
      // FM can request update approval
      const existingDraft = await prisma.updateapproval.findUnique({
        where: { id: project.idproject },
      });
      if (existingDraft) {
        //TODO: consider the need to have more than 1 draft for each project
        const updatedDraft = await prisma.updateapproval.update({
          where: { id: project.idproject },
          data: {
            information: draftJson,
            ucreator: userId,
            administrator: project.projectmanager,
            approval: "Not_Approved",
          },
        });
        res.json({ success: true, draft: updatedDraft });
      }
      const updatedDraft = await prisma.updateapproval.create({
        data: {
          id: project.idproject,
          information: draftJson,
          ucreator: userId,
          administrator: project.projectmanager,
          approval: "Not_Approved",
        },
      });
      //TODO approval system still need to be implemented as in sending admin notification and they can approve or not and add comment and the approval removal fix thingy
      res.json({ success: true, draft: updatedDraft });
    } else {
      res.status(HTTP_UNAUTHORIZED).send("PM is not assigned to project");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
}

router.use(authenticateToken);

router.get("/", asyncHandler(getAllProjects));
//todo turn completion into middlware and use it here too
router.get(
  "/projectType/:projectType/date/:date/clientName/:clientName",
  getProject
);
router.get("/information", getInformation);
router.get("/search/:searchTerm", asyncHandler(searchProject));

router.use(bodyParser.json()); //todo check if removeable

router.post("/validate25", validate25);
router.post("/validate50", validate50);
router.post("/validate75", validate75);

router.post("/create", createProject);
router.post(
  "/update/projectType/:projectType/date/:date/clientName/:clientName",
  updateProject
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
