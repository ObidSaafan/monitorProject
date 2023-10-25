import express from "express";

import authenticateToken from "../../middleware/authentication";
import { saveDraft, viewAll } from "./draft.services";

const router = express.Router();

router.use(express.json());
router.use(authenticateToken);
//TODO save draft as project
router.get("/viewall", viewAll);
router.post("/save-draft", saveDraft);

export default router;
