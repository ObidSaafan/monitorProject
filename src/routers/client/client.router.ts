import { Router } from "express";
import asyncHandler from "express-async-handler";
import { addClient, getClientInformation, getClients } from "./client.services";
import authenticateToken from "../../middleware/authentication";

const router = Router();

router.use(authenticateToken);
router.post("/add", asyncHandler(addClient));
router.get("/", asyncHandler(getClients));
router.get("/information", asyncHandler(getClientInformation));
export default router;
