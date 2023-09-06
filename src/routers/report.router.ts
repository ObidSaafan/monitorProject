import express from "express";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import path from "path";
import authenticateToken from "../middleware/authentication";
const prisma = new PrismaClient();
const router = express();
router.use(authenticateToken);
router.get("/export-to-excel", async (req, res) => {
  try {
    const userId = req.user?.id; // Get the user's ID from the authenticated user

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }

    const filters = req.body.filters || {}; // Provide an empty object as default if filters are missing

    const whereConditions: any = {};

    if (filters.projectType !== undefined && filters.projectType !== null) {
      whereConditions.projecttype = filters.projectType;
    }

    if (filters.projectStatus !== undefined && filters.projectStatus !== null) {
      whereConditions.projectstatus = filters.projectStatus;
    }
    //todo start date ?
    //todo project manager
    //todo client
    //todo currency
    //todo contract value

    if (
      filters.contractStatus !== undefined &&
      filters.contractStatus !== null
    ) {
      whereConditions.contractstatus = filters.contractStatus;
    }

    if (filters.actualProfit !== undefined && filters.actualProfit !== null) {
      const [operator, value] = filters.actualProfit.split(":");
      whereConditions.actualprofit = {
        [operator]: parseInt(value),
      };
    }
    //! fix the ones that arent in project table
    //todo expected profit
    //todo budgeted cost

    if (
      filters.revenueRecognized !== undefined &&
      filters.revenueRecognized !== null
    ) {
      const [operator, value] = filters.revenueRecognized.split(":");
      whereConditions.revenuerecognized = {
        [operator]: parseInt(value),
      };
    }

    //todo maybe date on revenue and other stuff
    //todo invoice value
    //todo invoice status
    //todo client pm email/ name clientid
    //todo Client name clientid
    //todo Actual spend value idproject
    //todo contract value
    // Add more filter conditions as needed

    const projects = await prisma.project.findMany({
      where: whereConditions,
    });

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Projects");

    // Define headers for the Excel sheet
    const headers = [
      "project ID",
      "Project Name",
      "Description",
      "Project Type",
      "Project Status",
      "Project Start Date",
      "Project Manager",
      "Client Project Manager",
      "Duration Of Project",
      "Planned Completion Date",
      "Currency",
      "Contract Value",
      "Contract Status",
      "Reference Number",
      "Expected Profit",
      "Actual Profit",
      "Client Name",
      "Comments",
    ];
    sheet.addRow(headers);

    for (const project of projects) {
      const projectManager = await prisma.user.findFirst({
        where: {
          iduser: project.projectmanager,
        },
      });

      const clientPM = await prisma.clientpm.findFirst({
        where: {
          clientpmid: project.clientpmid, // Assuming the user ID is stored in project.projectmanager
        },
      });

      const client = await prisma.client.findUnique({
        where: {
          clientid: project.clientid, // Assuming the user ID is stored in project.projectmanager
        },
      });

      sheet.addRow([
        project.idproject,
        project.projectname,
        project.description,
        project.projecttype,
        project.projectstatus,
        project.projectstartdate,
        projectManager?.firstname + " " + projectManager?.lastname,
        clientPM?.name,
        project.durationOfproject,
        project.plannedcompletiondate,
        project.currency,
        project.contractvalue,
        project.contractstatus,
        project.referencenumber,
        project.expectedprofit,
        project.actualprofit,
        client?.clientname,
        project.comments,
      ]);
    }

    // Generate a unique filename for the Excel file
    const excelFilePath = path.join(__dirname, "projects.xlsx");

    // Save the workbook to the file
    await workbook.xlsx.writeFile(excelFilePath);

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=projects.xlsx");

    // Send the Excel file as a response
    res.sendFile(excelFilePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while exporting data." });
  }
});

export default router;
