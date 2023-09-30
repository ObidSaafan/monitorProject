import { PrismaClient, project, type, status, currency } from "@prisma/client";
import express, { Router } from "express";
import asyncHandler from "express-async-handler";
import ExcelJS from "exceljs";
import { projectExcelHeaders } from "../../types/project.headers";
import path from "path";
type User = {};
const user: User[] = [];

const router = Router();
const prisma = new PrismaClient();
interface filterType {
  idp: string;
  idproject: string;
  projectname: string;
  description: string | null;
  projecttype: type;
  projectstatus: status;
  projectstartdate: Date;
  projectmanager: string;
  currency: currency;
}
async function exportTable(req: express.Request, res: express.Response) {
  const { filters }: { filters: filterType } = req.body;

  //result
  let formattedProjects: any;
  try {
    const projects = await prisma.project.findMany({
      where: { ...filters },
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

router.get("/", exportTable);

export default router;
