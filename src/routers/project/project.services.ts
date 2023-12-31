import express from "express";
import {
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
} from "../../constants/http_status";
import {
  allowedProjectTypes,
  allowedProjectStatuses,
  allowedContractStatuses,
  allowedCurrencies,
} from "../../constants/allowed_types";
import { PrismaClient } from "@prisma/client";
import { filterType } from "../../../types/ProjectFilter.type";
import ExcelJS from "exceljs";
import { projectExcelHeaders } from "../../../types/ProjectExport.headers";

const prisma = new PrismaClient();

export async function getAllProjects(
  req: express.Request,
  res: express.Response
) {
  const userRole = req.user?.role;
  const userId = req.user?.id;
  let projects;
  if (userRole === "1") {
    projects = await prisma.project.findMany({
      include: { Sprojectmanager: true },
    });
  } else {
    projects = await prisma.project.findMany({
      where: { projectmanager: userId },
      include: { Sprojectmanager: true },
    });
  }
  const projectsWithCompletion = await Promise.all(
    projects.map(async (project) => {
      const revenuerecognized = await prisma.revenuerecognized.findMany({
        where: { idproject: project.idproject },
      });

      const totalRevenue = revenuerecognized.reduce(
        (sum, entry) => sum + entry.value,
        0
      );
      const contractValue = project.contractvalue;
      const completion = (totalRevenue / contractValue) * 100;

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
        completion: completion.toFixed(2),
      };
    })
  );

  res.json(projectsWithCompletion);
}

export async function getProject(req: express.Request, res: express.Response) {
  const { projectType, date, clientName } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
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
    if (userRole != "1") {
      if (!userId || project.projectmanager !== userId) {
        return res.status(401).json({
          error: "Unauthorized: User ID is missing or not authorized.",
        });
      }
    }
    const updaterequest = await prisma.updateapproval.findUnique({
      where: { id: project.idproject },
    });
    if (!updaterequest) {
      res.json({ project }); // Send response without updaterequest
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
      res.json({ project, updaterequest });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
}
export async function getInformation(
  req: express.Request,
  res: express.Response
) {
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
export async function searchProject(
  req: express.Request,
  res: express.Response
) {
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

export function validate25(req: express.Request, res: express.Response) {
  const { contractStatus } = req.body;

  if (!allowedContractStatuses.includes(contractStatus)) {
    return res.status(400).json({ error: "Invalid contract status." });
  }

  res.json({ success: true });
}
export function validate50(req: express.Request, res: express.Response) {
  const { projectStatus, projectType } = req.body;

  if (!allowedProjectStatuses.includes(projectStatus)) {
    return res.status(400).json({ error: "Invalid project status." });
  }
  if (!allowedProjectTypes.includes(projectType)) {
    return res.status(400).json({ error: "Invalid project type." });
  }

  res.json({ success: true });
}

export function validate75(req: express.Request, res: express.Response) {
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

export async function createProject(
  req: express.Request,
  res: express.Response
): Promise<void> {
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
    res.status(401).json({ error: "Unauthorized: User ID is missing." });
    return;
  }

  // Check if the user has the roleid of 1 (assuming 1 is the admin role)
  if (userRole !== "1") {
    res
      .status(403)
      .json({ error: "Forbidden: User does not have permission." });
    return;
  }

  let project;
  if (projectName) {
    project = await prisma.project.findFirst({
      where: {
        projectname: projectName,
      },
    });
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
        plannedcompletiondate: plannedCompletionDate
          ? new Date(plannedCompletionDate)
          : null,
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
export async function updateProject(
  req: express.Request,
  res: express.Response
) {
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
      return res.status(404).json("Not Found");
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
      res.json({ updatedProject });
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
        res.json({ draft: updatedDraft });
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
      res.json({ draft: updatedDraft });
    } else {
      res.status(HTTP_UNAUTHORIZED).json("PM is not assigned to project");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
}
export async function filterProjects(
  req: express.Request,
  res: express.Response
) {
  const { filters }: { filters: filterType } = req.body;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  if (userRole !== "1") {
    if (!filters.projectmanager) {
      filters.projectmanager = userId;
    } else if (filters.projectmanager !== userId) {
      res.sendStatus(HTTP_UNAUTHORIZED);
      return;
    }
  }

  //extract name for fuzzy search
  let nameSearch = "";
  if (filters.projectname) {
    nameSearch = filters.projectname;
    delete filters.projectname;
  }
  try {
    const projects = await prisma.project.findMany({
      where: { ...filters, projectname: { contains: nameSearch } },
      include: {
        Sprojectmanager: true,
      },
    });

    const projectsWithCompletion = await Promise.all(
      projects.map(async (project) => {
        const revenuerecognized = await prisma.revenuerecognized.findMany({
          where: { idproject: project.idproject },
        });

        const totalRevenue = revenuerecognized.reduce(
          (sum, entry) => sum + entry.value,
          0
        );
        const contractValue = project.contractvalue;
        const completion = (totalRevenue / contractValue) * 100;

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
          completion: completion.toFixed(2),
        };
      })
    );
    res.send(projectsWithCompletion);
  } catch (err) {
    console.error(err);
    res.status(500).send("Invalid Filters");
    return;
  }
}

export async function exportReport(
  req: express.Request,
  res: express.Response
) {
  const { filters }: { filters: filterType } = req.body;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  if (userRole !== "1") {
    if (!filters.projectmanager) {
      filters.projectmanager = userId;
    } else if (filters.projectmanager !== userId) {
      res.sendStatus(HTTP_UNAUTHORIZED);
      return;
    }
  }

  let nameSearch = "";
  if (filters.projectname) {
    nameSearch = filters.projectname;
    delete filters.projectname;
  }
  //result
  let formattedProjects: any;
  try {
    const projects = await prisma.project.findMany({
      where: { ...filters, projectname: { contains: nameSearch } },
      include: {
        client: true,
        pmclient: true,
        Sprojectmanager: true,
        actualspend: true,
        revenuerecognized: true,
      },
    });

    formattedProjects = projects.map((proj) => {
      return {
        ...proj,
        projectmanager:
          proj.Sprojectmanager.firstname + " " + proj.Sprojectmanager.lastname,
        clientpm: proj.pmclient.name,
        client: proj.client.clientname,
        projectstartdate: proj.projectstartdate.toISOString(),
        totalspend: proj.actualspend.reduce(
          (sum, spend) => sum + spend.value,
          0
        ),
        totalrevenue: proj.revenuerecognized.reduce(
          (sum, revenue) => sum + revenue.value,
          0
        ),
      };
    });
  } catch {
    res.status(500).send("Invalid Filters");
    return;
  }

  let workbook = new ExcelJS.Workbook(); // Creating workbook
  let worksheet = workbook.addWorksheet("Profile"); // Creating worksheet

  worksheet.columns = projectExcelHeaders;

  worksheet.addRows(formattedProjects);

  const fileName = "Projects";
  // Set response headers
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + fileName + ".xlsx"
  );
  // Stream file
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
}
