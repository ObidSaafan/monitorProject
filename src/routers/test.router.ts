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

}

router.get("/", exportTable);

export default router;
