import { Router } from "express";
import asyncHandler from "express-async-handler";
import authenticateToken from "../../middleware/authentication";
import {
  createProject,
  exportReport,
  filterProjects,
  getAllProjects,
  getInformation,
  getProject,
  searchProject,
  updateProject,
  validate25,
  validate50,
  validate75,
} from "./project.services";

const bodyParser = require("body-parser");

const router = Router();

router.use(authenticateToken);

router.get("/", asyncHandler(getAllProjects));
//todo turn completion into middlware and use it here too
router.get(
  "/projectType/:projectType/date/:date/clientName/:clientName",
  getProject
);
router.get("/filter", asyncHandler(filterProjects));
router.get("/information", getInformation);
router.get("/search/:searchTerm", asyncHandler(searchProject));

router.use(bodyParser.json()); //todo check if removeable

router.post("/validate25", validate25);
router.post("/validate50", validate50);
router.post("/validate75", validate75);

router.post("/create", asyncHandler(createProject));
router.post(
  "/update/projectType/:projectType/date/:date/clientName/:clientName",
  updateProject
);
router.get("/report", asyncHandler(exportReport));
export default router;
