import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import authenticateToken from '../middleware/authentication';
const prisma = new PrismaClient();
const router = express.Router();

router.use(express.json());
router.use(authenticateToken);

router.post('/save-draft', async (req: express.Request, res: express.Response) => {
  //try {
    const { draftid, draft } = req.body; // Use the received draftid
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID is missing.' });
    }
    // Convert the draft object to a JSON string
    const draftJson = JSON.stringify(draft);
    if (draftid) {
    const existingDraft = await prisma.draft.findUnique({
      where: { draftid: draftid },
    });

    // Check if the draft with draftid exists
    if (!existingDraft) {
      return res.status(404).json({ error: 'Draft not found.' });
    }

    // Check if the creator is the same as the user performing the update
    if (existingDraft.creator !== userId) {
      return res.status(403).json({ error: 'Forbidden: You are not the creator of this draft.' });
    }




    
      // Update existing draft
      const updatedDraft = await prisma.draft.update({
      where: { draftid: draftid },
      data: {
        draft: draftJson,
      },
    });

      res.json({ success: true, draft: updatedDraft });
    } 
    else {
      // Create new draft
      const draftInput = {
        draftid: uuidv4(),
        draft: draftJson,
        creator: userId, // Use the user's ID here
      };
  
      const newDraft = await prisma.draft.create({
        data: draftInput
      });

      res.json({ success: true, draft: newDraft });
    }
  } //catch (error) {
    //res.status(500).json({ error: 'Failed to save draft.' });
  //}
//}
);

export default router;
