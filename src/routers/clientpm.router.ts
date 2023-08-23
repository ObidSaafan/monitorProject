/*import {Router} from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler'
import { HTTP_BAD_REQUEST } from '../constants/http_status';
import { PrismaClient, clientpm } from '@prisma/client';


const prisma = new PrismaClient()

const router = Router();

// so they can add a new client on their own later, + needed this to make it easier to create a project since there is a foriegn key 
//make a client pm add 
////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/add', asyncHandler(
    async (req, res) => {
      const {pmName,pmEmail,company} = req.body;
      const pm = await prisma.clientpm.findFirst({
        where:{
            email:pmEmail
            
        }});
      if(pm){
        res.status(HTTP_BAD_REQUEST)
        .send('client already exist!');
        return;
      }
  
      const newPM: clientpm = await prisma.clientpm.create({
        data:{
            name:pmName.toLowerCase(),
            email:pmEmail.toLowerCase(),
            clientid:company

        },
      },
    )
    res.send(generateTokenReponse(newPM));
}
));


const generateTokenReponse = (clientpm : clientpm) => {
  const token = jwt.sign({
    name:clientpm.name,
    email:clientpm.email,
    clientid:clientpm.clientid,
    },process.env.JWT_SECRET!,{
    expiresIn:"30d"
  });

  return {
    name:clientpm.name,
    email:clientpm.email,
    clientid:clientpm.clientid,
    token: token
  };
}

export default router; */
