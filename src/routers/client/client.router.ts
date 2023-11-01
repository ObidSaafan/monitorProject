import { Router } from "express";
import asyncHandler from "express-async-handler";
import { addClient, getClients } from "./client.services";
import authenticateToken from "../../middleware/authentication";

const router = Router();

router.use(authenticateToken);
router.post("/add", asyncHandler(addClient));
router.get("/", asyncHandler(getClients));
export default router;
