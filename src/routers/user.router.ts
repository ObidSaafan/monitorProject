import {Router} from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler'
import { HTTP_BAD_REQUEST } from '../constants/http_status';
import { PrismaClient, User } from '@prisma/client'
import { compare } from 'bcryptjs';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

const router = Router();

router.post("/login", asyncHandler(
    async (req, res) => {
        
        const {Email, Password} = req.body; 
        const user = await prisma.user.findUnique({
            where:{
                email:Email,
            },  
            select:{
                iduser:true,
                email:true,
                password:true,
                firstname:true,
                lastname:true,
                roleid:true
            }
        });
        //look using mysql in db for username and password maybe need orm or keep rawdata
        if(user && (await bcrypt.compare(Password,user.password))) {
            res.send(generateTokenReponse(user));
           }
        else{
            res.status(HTTP_BAD_REQUEST).send("Email or Password is invalid");
            }
    }
));


router.post('/register', asyncHandler(
    async (req, res) => {
      const {firstname, lastname, Email, Password} = req.body;
      const user = await prisma.user.findUnique({
        where:{
            email:Email,
        }});
      if(user){
        res.status(HTTP_BAD_REQUEST)
        .send('User is already exist, please login!');
        return;
      }
  
      const encryptedPassword = await bcrypt.hash(Password, 10);
  
      const newUser: User = await prisma.user.create({
        data:{
        firstname,
        lastname,
        email: Email.toLowerCase(),
        password: encryptedPassword,
        roleid: '1'
        },
      },
    )
      res.send(generateTokenReponse(newUser));
    }
));

  
    const generateTokenReponse = (user : User) => {
      const token = jwt.sign({
        id: user.iduser, email:user.email
        },process.env.JWT_SECRET!,{
        expiresIn:"30d"
      });
    
      return {
        id: user.iduser,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.roleid,
        token: token
      };
    }

export default router; 