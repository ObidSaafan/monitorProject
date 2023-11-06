import { Router } from "express";
import asyncHandler from "express-async-handler";
import {
  addClient,
  addClientPM,
  getClientInformation,
  getClients,
  removeClientPM,
} from "./client.services";
import authenticateToken from "../../middleware/authentication";

const router = Router();

router.use(authenticateToken);
router.get("/", asyncHandler(getClients));
router.get("/information", asyncHandler(getClientInformation));

router.post("/add", asyncHandler(addClient));

router.post("/addPM", asyncHandler(addClientPM));
router.post("/removePM", asyncHandler(removeClientPM));
export default router;
