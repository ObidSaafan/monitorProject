import {Router} from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler'
import { HTTP_BAD_REQUEST } from '../constants/http_status';
import { allowedProjectTypes,allowedProjectStatuses,allowedContractStatuses,allowedCurrencies } from '../constants/allowed_types';
import { PrismaClient, project, client, clientpm, budgetedcost, paymentmilestone} from '@prisma/client'


const prisma = new PrismaClient()

const router = Router();


router.get("/",asyncHandler(
    async (req, res) => {
      const projects = await prisma.project.findMany();
        res.send(projects);
    }
  ))

router.get('/information', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        clientpm: true, // Include the project managers associated with each client
      },
    });

    const clientsdata = clients.map((client) => {
      return {
        clientid: client.clientid,
        clientname: client.clientname,
        pms: client.clientpm, // The associated project managers are already included by Prisma
      };
    });
    const pms = await prisma.user.findMany({
      where: {
      roleid: "2"
      }
    });
    const dropdownOptions = {
      contractStatuses: allowedContractStatuses,
      projectStatuses: allowedProjectStatuses,
      projectTypes: allowedProjectTypes,
      currencies: allowedCurrencies,
    };

    // Send both dropdownOptions and dataToSend in the response
    res.json({ dropdownOptions, clientsdata,pms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  /*router.get("/search/:searchTerm", asyncHandler(
    async (req, res) => {
        const result = await prisma.project.findMany({
            where: {
              contains: {}
            },
            select: {
              projectname: true,
            },
          })
           // res.send(result);
        }
  ))*/


router.post('/validate25', (req, res) => {
    const { contractStatus } = req.body;
  
    if (!allowedContractStatuses.includes(contractStatus)) {
      return res.status(400).json({ error: 'Invalid contract status.' });
    }
  
    res.json({ success: true });
});
      
router.post('/validate50', (req, res) => {
  const { projectStatus,projectType } = req.body;

  if (!allowedProjectStatuses.includes(projectStatus)) {
    return res.status(400).json({ error: 'Invalid project status.' });
  }
  if (!allowedProjectTypes.includes(projectType)) {
    return res.status(400).json({ error: 'Invalid project type.' });
  }
   
  res.json({ success: true });
});

router.post('/validate75', (req, res) => {
  const { Currency, paymentMilestones } = req.body;

  if (!allowedCurrencies.includes(Currency)) {
    return res.status(400).json({ error: 'Invalid currency.' });
  }

  // Calculate the total sum of payment terms dynamically
  const totalPaymentTerms = paymentMilestones.reduce((sum: number, term: { value: number }) => sum + term.value, 0);


  if (totalPaymentTerms !== 100) {
    return res.status(400).json({ error: 'Invalid payment terms total.' });
  }

  res.json({ success: true });
});


router.post('/create', asyncHandler(
    async (req, res) => {
      const {projectName,Description, projectType, projectStatus, projectStartDate, durationOfProject,plannedCompletionDate, Currency,contractValue,contractStatus,referenceNumber,expectedProfit, actualProfit,projectmanagerf,projectmanagerl,clientName, paymentMilestones,budgetedcosts,projectmanagerclient} = req.body;
      const project = await prisma.project.findFirst({
        where:{
            projectname: projectName,
        }});
      if(project){
        res.status(HTTP_BAD_REQUEST)
        .send('project already exists!');
        return;
      }
      
      // paymentmilestoneValue,paymentmilestoneDesc
      
      const client = await prisma.client.findUnique({
        where: {
          clientname: clientName,
        },
      });
      if (!client) {
        // Handle the case where the client doesn't exist
        res.status(HTTP_BAD_REQUEST).send('Client does not exist.');
        return ;
      }
      const pm = await prisma.user.findFirst({
        where: {
         firstname:projectmanagerf,
         lastname:projectmanagerl
        },
      });
      if (!pm) {
        // Handle the case where the client doesn't exist
        res.status(HTTP_BAD_REQUEST).send('pm does not exist.');
        return ;
      }
      const cpm = await prisma.clientpm.findFirst({
        where: {
         name:projectmanagerclient,
        },
      });
      if (!cpm) {
        // Handle the case where the client doesn't exist
        res.status(HTTP_BAD_REQUEST).send('pm does not exist.');
        return ;
      }
     /* const newProject: project = await prisma.project.create({
        data:{
        idproject: projectType + "/"+ projectStartDate +"/"+ clientName, 
        //add sequence number after client name to cover the case where everything is the same 
        projectname: projectName, 
        description:Description,
        projecttype:projectType, 
        projectstatus:projectStatus, 
        projectstartdate:projectStartDate, 
        durationOfproject:durationOfProject,
        plannedcompletiondate:plannedCompletionDate,
        currency:Currency,
        contractvalue:contractValue,
        contractstatus:contractStatus,
        referencenumber:referenceNumber,
        expectedprofit:expectedProfit,
        actualprofit:actualProfit,
        projectmanager: projectmanager,
        clientid : clientName // ask if clients can have same name if yes for now ill leave it like this but later on we want to make it take the name of the client and then find the matching name and put it here
        },
        //terms and budgeted cost ii think need to research
      },
    )
    res.send(generateTokenReponse(newProject)); */

    try {
      const newProject = await prisma.project.create({
        data: {
          idproject: projectType + "/" + projectStartDate + "/" + client.clientname, // Use client.clientid
          projectname: projectName,
          description: Description,
          projecttype: projectType,
          projectstatus: projectStatus,
          projectstartdate: projectStartDate,
          durationOfproject: durationOfProject,
          plannedcompletiondate: plannedCompletionDate,
          currency: Currency,
          contractvalue: contractValue,
          contractstatus: contractStatus,
          referencenumber: referenceNumber,
          expectedprofit: expectedProfit,
          actualprofit: actualProfit,
          projectmanager: pm.iduser,
          clientpmid: cpm.clientpmid,
          clientid: client.clientid, // Use client.clientid
          paymentmilestone: {
            create: paymentMilestones.map((milestone: { text: string; value: number }) => ({
              milestonetext: milestone.text,
              milestonevalue: milestone.value,
            }))},
            budgetedcost: {
              create: budgetedcosts.map((cost: { text: string; value: number }) => ({
                source: cost.text,
                value: cost.value,
              })),
        },
     }});
      
       /* const createdPaymentMilestones = await Promise.all(
          paymentMilestones.map(async (milestone: { value: number; description: string }) => {
            return await prisma.paymentmilestone.create({
              data: {
                milestonevalue: milestone.value,
                milestonetext: milestone.description,
                project: { connect: { idproject: newProject.idproject } },
              },
            });
          })
        );
      */
      res.status(201).send(newProject);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
));


  const generateTokenReponse = (project : project) => {
    const token = jwt.sign({
      idproject: project.idproject, //NAME OF CLIENT MUST BE UNIQUE TO MAKE THIS WORK ,put the corrospeonding name of client at the end
      projectname: project.projectname, 
      description:project.description,
      projecttype:project.projecttype, 
      projectstatus:project.projectstatus, 
      projectstartdate:project.projectstartdate, 
      durationOfproject:project.durationOfproject,
      plannedcompletiondate:project.plannedcompletiondate,
      currency:project.currency,
      contractvalue:project.contractvalue,
      contractstatus:project.contractstatus,
      referencenumber:project.referencenumber,
      expectedprofit:project.expectedprofit,
      actualprofit:project.actualprofit,
      projectmanager: project.projectmanager,
      clientid : project.clientid
      },process.env.JWT_SECRET!,{
      expiresIn:"30d"
    });
  
    return {
      idproject: project.idproject, //NAME OF CLIENT MUST BE UNIQUE TO MAKE THIS WORK ,put the corrospeonding name of client at the end
      projectname: project.projectname, 
      description:project.description,
      projecttype:project.projecttype, 
      projectstatus:project.projectstatus, 
      projectstartdate:project.projectstartdate, 
      durationOfproject:project.durationOfproject,
      plannedcompletiondate:project.plannedcompletiondate,
      currency:project.currency,
      contractvalue:project.contractvalue,
      contractstatus:project.contractstatus,
      referencenumber:project.referencenumber,
      expectedprofit:project.expectedprofit,
      actualprofit:project.actualprofit,
      projectmanager: project.projectmanager,
      clientid : project.clientid,
      token: token
    };
  }

export default router; 

/*
[
  {
    id: 'project_name',
    rule: 'r/wr',
    permission: 'projectNameRead',
    status: project.status,
    type: project.type,
    preconditionn: precon
  },
  {
    id: 'project_name',
    rule: 'wr',
    permission: 'projectNameRead',
    status: project.status,
    type: project.type
  }
] */