import { PrismaClient, project } from "@prisma/client";
import express, { Router } from "express";
import asyncHandler from "express-async-handler";
import ExcelJS from "exceljs";
import { projectExcelHeaders } from "../../types/project.headers";
import path from "path";
type User = {};
const user: User[] = [];

const router = Router();
const prisma = new PrismaClient();

async function exportTable(req: express.Request, res: express.Response) {
  const projects = await prisma.project.findMany({
    include: { client: true, pmclient: true, Sprojectmanager: true },
  });

  const formattedProjects = projects.map((proj) => {
    return {
      ...proj,
      projectmanager:
        proj.Sprojectmanager.firstname + " " + proj.Sprojectmanager.lastname,
      clientpm: proj.pmclient.name,
      client: proj.client.clientname,
      projectstartdate: proj.projectstartdate.toISOString(),
    };
  });

  let workbook = new ExcelJS.Workbook(); // Creating workbook
  let worksheet = workbook.addWorksheet("Profile"); // Creating worksheet

  worksheet.columns = projectExcelHeaders;

  worksheet.addRows(formattedProjects);

  const filePath = path.join(__dirname, "projects.xlsx");
  await workbook.xlsx.writeFile(filePath);

  // Set response headers
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=projects.xlsx");

  // Send the Excel file as a response
  res.sendFile(filePath, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Sent");
    }
  });
}

router.get("/", exportTable);

export default router;
