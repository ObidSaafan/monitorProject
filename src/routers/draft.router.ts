import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client'; // Import Prisma types

import authenticateToken from '../middleware/authentication';
const prisma = new PrismaClient();
const router = express.Router(); // Create an instance of the router

// Middleware for the router
router.use(express.json());

// Apply authentication middleware to the router
router.use(authenticateToken);

// Define the API endpoint for saving drafts
router.post('/save-draft', async (req: express.Request, res: express.Response) => {
  try {
    const { id: draftId, ...draftData } = req.body;
    const userId = req.user?.id; // Assuming you have the user's ID available

    // Ensure that userId is defined before proceeding
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID is missing.' });
    }

    // Define the draft creation input based on your Prisma schema
    const draftInput = {
      draftid: uuidv4(),
      draft: draftData,
      creator: userId, // Use the user's ID here
    };

    if (draftId) {
      // Update existing draft
      const updatedDraft = await prisma.draft.update({
        where: { draftid: draftId },
        data: {
          draft: draftData,
        },
      });

      res.json({ success: true, draft: updatedDraft });
    } else {
      // Create new draft
      const newDraft = await prisma.draft.create({
        data: draftInput,
      });

      res.json({ success: true, draft: newDraft });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save draft.' });
  }
});

export default router; // Export the router instance
