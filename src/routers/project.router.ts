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


    const dropdownOptions = {
      contractStatuses: allowedContractStatuses,
      projectStatuses: allowedProjectStatuses,
      projectTypes: allowedProjectTypes,
      currencies: allowedCurrencies,
    };

    res.send(dropdownOptions);}
    catch (err) {
    console.error(err);
    res.status(500)
    .send({ error: 'Internal Server Error' });
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


router.post('/contractStatus', (req, res) => {
    const { contractStatus } = req.body;
  
    if (!allowedContractStatuses.includes(contractStatus)) {
      return res.status(400).json({ error: 'Invalid contract status.' });
    }
  
    res.json({ success: true });
});
      
router.post('/projectTS', (req, res) => {
  const { projectStatus,projectType } = req.body;

  if (!allowedProjectStatuses.includes(projectStatus)) {
    return res.status(400).json({ error: 'Invalid project status.' });
  }
  if (!allowedProjectTypes.includes(projectType)) {
    return res.status(400).json({ error: 'Invalid project type.' });
  }
   
  res.json({ success: true });
});

router.post('/currency', (req, res) => {
  const { currency } = req.body;

  if (!allowedCurrencies.includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency.' });
  }

  res.json({ success: true });
});


router.post('/create', asyncHandler(
    async (req, res) => {
      const {projectName,Description, projectType, projectStatus, projectStartDate, durationOfProject,plannedCompletionDate, Currency,contractValue,contractStatus,referenceNumber,expectedProfit, actualProfit,projectmanager,clientName} = req.body;
      const project = await prisma.project.findFirst({
        where:{
            projectname: projectName,
        }});
      if(project){
        res.status(HTTP_BAD_REQUEST)
        .send('project already exists!');
        return;
      }
      
      const newProject: project = await prisma.project.create({
        data:{
        idproject: projectType + "/"+ projectStartDate +"/", //NAME OF CLIENT MUST BE UNIQUE TO MAKE THIS WORK ,put the corrospeonding name of client at the end
        //add sequence number after client name  
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
      },
    )
    res.send(generateTokenReponse(newProject));
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