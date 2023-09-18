import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
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

    // const whereConditions: any = {};
    // const groupByConditions: any = {};
    //todo transfer type done
    // if (filters.projectType !== undefined && filters.projectType !== null) {
    //   whereConditions.projecttype = filters.projectType;
    // }
    //todo transfer status done
    // if (filters.projectStatus !== undefined && filters.projectStatus !== null) {
    //   whereConditions.projectstatus = filters.projectStatus;
    // }
    //todo start date ?
    //todo test and look into logic since it needs 1 field or 2 fields or let user input 1 field and u can divide it into 2 fields
    // if (
    //   filters.projectManagerfirstname !== undefined &&
    //   filters.projectManagerfirstname !== null &&
    //   filters.projectManagerlastname !== undefined &&
    //   filters.projectManagerlastname !== null
    // ) {
    //   const projectManagerUser = await prisma.user.findFirst({
    //     where: {
    //       firstname: filters.projectManagerfirstname,
    //       lastname: filters.projectManagerlastname,
    //     },
    //   });
    //   if (projectManagerUser) {
    //     whereConditions.projectmanager = projectManagerUser.iduser;
    //   }
    // }

    // if (filters.client !== undefined && filters.client !== null) {

    //     whereConditions.clientname = filters.client;

    // }

    //todo transfered currency done
    // currency
    // if (filters.currency !== undefined && filters.currency !== null) {
    //   whereConditions.currency = filters.currency;
    // }

    // contract status
    //todo transfered contractstatus done
    // if (
    //   filters.contractStatus !== undefined &&
    //   filters.contractStatus !== null
    // ) {
    //   whereConditions.contractstatus = filters.contractStatus;
    // }
    // actual profit
    //todo actual profit transfer
    // if (filters.actualProfit !== undefined && filters.actualProfit !== null) {
    //   const [operator, value] = filters.actualProfit.split(":");
    //   whereConditions.actualprofit = {
    //     [operator]: parseInt(value),
    //   };
    // }

    // expected profit
    //todo trasnfer expected profit done
    // if (
    //   filters.expectedprofit !== undefined &&
    //   filters.expectedprofit !== null
    // ) {
    //   const [operator, value] = filters.expectedprofit.split(":");
    //   whereConditions.expectedprofit = {
    //     [operator]: parseInt(value),
    //   };
    // }

    //todo maybe date on revenue and other stuff
    //todo invoice value
    //todo invoice status

    // client pm email/ name clientid
    //todo transfer client name
    // if (filters.clientpm !== undefined && filters.clientpm !== null) {
    //   const clientpmsearch = await prisma.clientpm.findFirst({
    //     where: {
    //       name: filters.clientpm,
    //     },
    //   });
    //   if (clientpmsearch) {
    //     whereConditions.clientpmid = clientpmsearch.clientpmid;
    //   }
    // }

    interface FilteredGroupSpend {
      idproject: string;
      _sum: {
        value: number | null;
      };
      // Add other properties as needed
    }
    interface FilteredGrouprev {
      idproject: string;
      _max: {
        value: number | null;
      };
      // Add other properties as needed
    }
    //! dont  need meet function since db handles the comparison
    // const meetsCondition = (
    //   dataValue: number,
    //   operator: string,
    //   userValue: number
    // ): boolean => {
    //   switch (operator) {
    //     case "gt":
    //       return dataValue > userValue;
    //     case "lt":
    //       return dataValue < userValue;
    //     case "gte":
    //       return dataValue >= userValue;
    //     case "lte":
    //       return dataValue <= userValue;
    //     default:
    //       return false; // Handle unsupported operators
    //   }
    // };
    //todo budgeted cost
    //todo revenue recognized done
    //! for revenue recognized it should compare values to last date and then only return that one
    // for now it will compare to every entry in the revenue recognized table, a better implementation will be to only compare to the last entry for each unique project
    // also since max should be last one so i will use it instead of date
    //! HERE IS OLD rev code
    // let filteredGrouprev: FilteredGrouprev[] = [];
    // if (
    //   filters.revenueRecognized !== undefined &&
    //   filters.revenueRecognized !== null
    // ) {
    //   const [operator, value] = filters.revenueRecognized.split(":");
    //   const userValue = value !== null ? parseInt(value) : 0;
    //   const highestRevenueRecognizedPerProject =
    //     await prisma.revenuerecognized.groupBy({
    //       by: ["idproject"],
    //       _max: {
    //         value: true,
    //       },
    //     });

    //   console.log(highestRevenueRecognizedPerProject);
    //   filteredGrouprev = highestRevenueRecognizedPerProject.filter((entry) => {
    //     return meetsCondition(entry._max.value!, operator, userValue);
    //   });
    // }
    // //! GROUP BY ALSO LIKE WHERE CONDITIONS IN ONE ???
    // // Declare the variable outside of the function
    // let filteredGroupSpends: FilteredGroupSpend[] = [];
    // if (filters.actualspend !== undefined && filters.actualspend !== null) {
    //   const [operator, value] = filters.actualspend.split(":");
    //   const userValue = value !== null ? parseInt(value) : 0;

    //   const groupspends = await prisma.actualspend.groupBy({
    //     by: ["idproject"],
    //     _sum: {
    //       value: true,
    //     },
    //   });
    //   filteredGroupSpends = groupspends.filter((entry) => {
    //     return meetsCondition(entry._sum.value!, operator, userValue);
    //   });
    // }
    //!ENDS HERE and new one follows
    const filterConditions = [];

    // Add filter conditions for revenueRecognized and actualspend
    if (
      filters.revenueRecognized !== undefined &&
      filters.revenueRecognized !== null
    ) {
      const [operator, value] = filters.revenueRecognized.split(":");
      const userValue = parseInt(value);
      filterConditions.push(`(
    SELECT MAX(value) FROM revenuerecognized WHERE idproject = project.idproject
  ) ${operator} ${userValue}`);
    }

    if (filters.actualspend !== undefined && filters.actualspend !== null) {
      const [operator, value] = filters.actualspend.split(":");
      const userValue = parseInt(value);
      filterConditions.push(`(
    SELECT SUM(value) FROM actualspend WHERE idproject = project.idproject
  ) ${operator} ${userValue}`);
    }

    if (filters.currency !== undefined && filters.currency !== null) {
      filterConditions.push(`currency = '${filters.currency}'`);
    }
    if (filters.projectStatus !== undefined && filters.projectStatus !== null) {
      filterConditions.push(`projectStatus = '${filters.projectStatus}'`);
    }

    if (filters.projectType !== undefined && filters.projectType !== null) {
      filterConditions.push(`projectType = '${filters.projectType}'`);
    }

    if (
      filters.contractStatus !== undefined &&
      filters.contractStatus !== null
    ) {
      filterConditions.push(`contractStatus  = '${filters.contractStatus}'`);
    }
    //todo need to check if expetected, actual, contract value  works
    if (
      filters.expectedprofit !== undefined &&
      filters.expectedprofit !== null
    ) {
      const [operator, value] = filters.expectedprofit.split(":");
      const userValue = parseInt(value);
      filterConditions.push(`expectedprofit ${operator} ${userValue}`);
    }
    if (filters.actualprofit !== undefined && filters.actualprofit !== null) {
      const [operator, value] = filters.actualprofit.split(":");
      const userValue = parseInt(value);
      filterConditions.push(`actualprofit ${operator} ${userValue}`);
    }

    if (filters.contractvalue !== undefined && filters.contractvalue !== null) {
      const [operator, value] = filters.contractvalue.split(":");
      const userValue = parseInt(value);
      filterConditions.push(`contractvalue ${operator} ${userValue}`);
    }

    // Build the Prisma SQL query with dynamic filter conditions
    const sqlQuery = Prisma.sql`
  SELECT *
  FROM project
  WHERE ${Prisma.raw(filterConditions.join(" AND "))}
`;

    const filteredProjects = await prisma.$queryRaw(sqlQuery);

    // Handle the results (check if filteredProjects is an array with results)
    if (Array.isArray(filteredProjects) && filteredProjects.length > 0) {
      // Handle the case when results are found
      console.log(filteredProjects); // Output the entire result array
    } else {
      // Handle the case when no results are found
      console.log("No results found.");
    }

    //! new ends here
    //  contract value
    //todo contract value done
    // if (filters.contractvalue !== undefined && filters.contractvalue !== null) {
    //   const [operator, value] = filters.contractvalue.split(":");
    //   whereConditions.contractvalue = {
    //     [operator]: parseInt(value),
    //   };
    // }
    // Add more filter conditions as needed

    const projects = await prisma.project.findMany({
      // where: whereConditions,
      // //! made it all in 1 call
      // include: {
      //   paymentmilestone: true, // Include related data from paymentmilestone table
      //   revenuerecognized: true, // Include related data from revenuerecognized table
      //   budgetedcost: true, // Include related data from budgetedcost table
      //   actualspend: true, // Include related data from actualspend table
      // },
    });
    //! we can retrieve this but then maybe if filter isnt one of the ones up then it will retrieve everything then chcek it in backend
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
      "Revenue recognized",
    ];
    sheet.addRow(headers);

    for (const project of projects) {
      //! joined in 1 query $transaction researched
      const projectDetails = await prisma.$transaction([
        prisma.user.findFirst({
          where: {
            iduser: project.projectmanager,
          },
        }),
        prisma.clientpm.findFirst({
          where: {
            clientpmid: project.clientpmid,
          },
        }),
        prisma.client.findUnique({
          where: {
            clientid: project.clientid,
          },
        }),
      ]);

      const [projectManager, clientPM, client] = projectDetails;

      // Get a list of unique idproject values that are common between filteredGroupSpends, filteredGrouprev, and projects
      //! this is related to spend and rev
      // const commonProjectIds = Array.from(
      //   new Set(
      //     filteredGroupSpends
      //       .filter((spendEntry) => {
      //         return (
      //           filteredGrouprev.some(
      //             (revEntry) => revEntry.idproject === spendEntry.idproject
      //           ) &&
      //           projects.some(
      //             (project) => project.idproject === spendEntry.idproject
      //           )
      //         );
      //       })
      //       .map((spendEntry) => spendEntry.idproject)
      //   )
      // );
      // console.log(commonProjectIds);
      // // need to apply more than 1 comparison here, 1 for each outside table so it will change here

      // const revenueRecognizedmax = filteredGrouprev.find(
      //   (entry) => entry.idproject === project.idproject
      // )?._max.value;

      // const totalActualSpend = filteredGroupSpends.find(
      //   (entry) => entry.idproject === project.idproject
      // )?._sum.value;

      // Create rows for each related actual spend entry
      //   commonProjectIds.forEach((entry) => {
      //     sheet.addRow([
      //       project.idproject,
      //       project.projectname,
      //       project.description,
      //       project.projecttype,
      //       project.projectstatus,
      //       project.projectstartdate,
      //       projectManager?.firstname + " " + projectManager?.lastname,
      //       clientPM?.name,
      //       project.durationOfproject,
      //       project.plannedcompletiondate,
      //       project.currency,
      //       project.contractvalue,
      //       project.contractstatus,
      //       project.referencenumber,
      //       project.expectedprofit,
      //       project.actualprofit,
      //       client?.clientname,
      //       project.comments,
      //       totalActualSpend,
      //       revenueRecognizedmax,
      //     ]);
      //   });
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
