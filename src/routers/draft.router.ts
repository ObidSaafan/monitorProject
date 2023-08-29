import express from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import authenticateToken from "../middleware/authentication";
const prisma = new PrismaClient();
const router = express.Router();

router.use(express.json());
router.use(authenticateToken);

router.get("/viewall", async (req, res) => {
  try {
    const userId = req.user?.id; // Get the user's ID from the authenticated user
    const userRole = req.user?.role; // Get the user's role from the authenticated user

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    // ! for now i will comment this part and make it only allow fm (role 1 ) to view drafts otherwise u cant

    if (userRole !== "1") {
      // User has roleid 1 (FM), so they can view all drafts
      // const drafts = await prisma.draft.findMany();
      // return res.json(drafts);
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    //!otherwise they are pm and can only view drafts of which they are the creator of ,, keep in mind tho i think pm shouldnt even create a draft im not sure we need to ask
    const drafts = await prisma.draft.findMany({
      where: {
        creator: userId, // Filter drafts where the creator is the logged-in user
      },
    });

    // Send drafts in the response
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/save-draft",
  async (req: express.Request, res: express.Response) => {
    //try {
    const { draftid, draft } = req.body; // Use the received draftid
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID is missing." });
    }
    // Convert the draft object to a JSON string
    //const draftJson = JSON.stringify(draft);
    if (draftid) {
      const existingDraft = await prisma.draft.findUnique({
        where: { draftid: draftid },
      });

      // Check if the draft with draftid exists
      if (!existingDraft) {
        return res.status(404).json({ error: "Draft not found." });
      }

      // Check if the creator is the same as the user performing the update
      if (existingDraft.creator !== userId) {
        return res
          .status(403)
          .json({ error: "Forbidden: You are not the creator of this draft." });
      }

      // Update existing draft
      const updatedDraft = await prisma.draft.update({
        where: { draftid: draftid },
        data: {
          draft: draft,
        },
      });

      res.json({ success: true, draft: updatedDraft });
    } else {
      // Create new draft
      const draftInput = {
        draftid: uuidv4(),
        draft: draft,
        creator: userId, // Use the user's ID here
      };

      const newDraft = await prisma.draft.create({
        data: draftInput,
      });

      res.json({ success: true, draft: newDraft });
    }
  } //catch (error) {
  //res.status(500).json({ error: 'Failed to save draft.' });
  //}
  //}
);

export default router;
