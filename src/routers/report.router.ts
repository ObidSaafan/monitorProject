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
    //! need to add a function to check if pm logged in  only show reports for the user logged in
    const filters = req.body.filters || {}; // Provide an empty object as default if filters are missing

    const whereConditions: any = {};

    if (filters.projectType !== undefined && filters.projectType !== null) {
      whereConditions.projecttype = filters.projectType;
    }

    if (filters.projectStatus !== undefined && filters.projectStatus !== null) {
      whereConditions.projectstatus = filters.projectStatus;
    }
    //todo start date ?
    //todo test and look into logic since it needs 1 field or 2 fields or let user input 1 field and u can divide it into 2 fields
    if (
      filters.projectManagerfirstname !== undefined &&
      filters.projectManagerfirstname !== null &&
      filters.projectManagerlastname !== undefined &&
      filters.projectManagerlastname !== null
    ) {
      const projectManagerUser = await prisma.user.findFirst({
        where: {
          firstname: filters.projectManagerfirstname,
          lastname: filters.projectManagerlastname,
        },
      });
      if (projectManagerUser) {
        whereConditions.projectmanager = projectManagerUser.iduser;
      }
    }
    //  client
    // if (filters.client !== undefined && filters.client !== null) {
    //   const clientSearch = await prisma.client.findFirst({
    //     where: {
    //       clientid: filters.client,
    //     },
    //   });
    //   if (clientSearch) {
    //     whereConditions.clientid = clientSearch.clientid;
    //   }
    // }

    // Client name clientid
    if (filters.client !== undefined && filters.client !== null) {
      const clientsearch = await prisma.client.findFirst({
        where: {
          clientname: filters.client,
        },
      });
      if (clientsearch) {
        whereConditions.clientid = clientsearch.clientid;
      }
    }

    // currency
    if (filters.currency !== undefined && filters.currency !== null) {
      whereConditions.currency = filters.currency;
    }

    // contract status

    if (
      filters.contractStatus !== undefined &&
      filters.contractStatus !== null
    ) {
      whereConditions.contractstatus = filters.contractStatus;
    }
    // actual profit
    if (filters.actualProfit !== undefined && filters.actualProfit !== null) {
      const [operator, value] = filters.actualProfit.split(":");
      whereConditions.actualprofit = {
        [operator]: parseInt(value),
      };
    }
    //! fix the ones that arent in project table
    // expected profit
    if (
      filters.expectedprofit !== undefined &&
      filters.expectedprofit !== null
    ) {
      const [operator, value] = filters.expectedprofit.split(":");
      whereConditions.expectedprofit = {
        [operator]: parseInt(value),
      };
    }
    //todo budgeted cost
    //revenue recognized
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

    // client pm email/ name clientid
    if (filters.clientpm !== undefined && filters.clientpm !== null) {
      const clientpmsearch = await prisma.clientpm.findFirst({
        where: {
          name: filters.clientpm,
        },
      });
      if (clientpmsearch) {
        whereConditions.clientpmid = clientpmsearch.clientpmid;
      }
    }
    //! working here on actual spend check gpt
    //todo Actual spend value idproject
    // if (filters.actualspend !== undefined && filters.actualspend !== null) {
    //   const actualspendsearch = await prisma.actualspend.findFirst({
    //     where: {
    //       value: filters.actualspend,
    //     },
    //   });
    //   if (actualspendsearch) {
    //     whereConditions.actualspend = actualspendsearch.idas;
    //   }
    // }
    //!
    interface FilteredGroupSpend {
      idproject: string;
      _sum: {
        value: number | null;
      };
      // Add other properties as needed
    }

    // Declare the variable outside of the function
    let filteredGroupSpends: FilteredGroupSpend[] = [];
    if (filters.actualspend !== undefined && filters.actualspend !== null) {
      const [operator, value] = filters.actualspend.split(":");
      const userValue = value !== null ? parseInt(value) : 0;

      const groupspends = await prisma.actualspend.groupBy({
        by: ["idproject"],
        _sum: {
          value: true,
        },
      });
      console.log(groupspends);
      //! grouping works correctly here

      const meetsCondition = (
        dataValue: number,
        operator: string,
        userValue: number
      ): boolean => {
        switch (operator) {
          case "gt":
            return dataValue > userValue;
          case "lt":
            return dataValue < userValue;
          case "gte":
            return dataValue >= userValue;
          case "lte":
            return dataValue <= userValue;
          default:
            return false; // Handle unsupported operators
        }
      };
      filteredGroupSpends = groupspends.filter((entry) => {
        return meetsCondition(entry._sum.value!, operator, userValue);
      });
    }

    console.log(filteredGroupSpends);
    //! it can compare now

    //!
    //  contract value
    if (filters.contractvalue !== undefined && filters.contractvalue !== null) {
      const [operator, value] = filters.contractvalue.split(":");
      whereConditions.contractvalue = {
        [operator]: parseInt(value),
      };
    }
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
      "Actual Spend Total",
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

      const relatedActualSpendEntries = filteredGroupSpends.filter(
        (entry) => entry.idproject === project.idproject
      );

      const totalActualSpend =
        filteredGroupSpends.find(
          (entry) => entry.idproject === project.idproject
        )?._sum.value || 0;

      // Create rows for each related actual spend entry
      relatedActualSpendEntries.forEach((entry) => {
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
          totalActualSpend,
        ]);
      });
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
