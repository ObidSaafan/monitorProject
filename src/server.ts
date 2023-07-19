import express from "express";
import cors from "cors";
import userRouter from './routers/user.router';
import dotenv from 'dotenv';

dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient()

async function main() {
    await prisma.user.create({
        data: {
            iduser:"1",
            email: "hani@prisma.com",
            password: "password",
            firstname: "hani",
            lastname: "has",
            role:{
                create:{
                    rolename:"fm",
                    permissions:"idk"
                },
            },
        },
        include:{
            role:true,
        },
        
    })
    
}


const app = express();
const port = 4001;
app.listen(port,() => {
    console.log("website served on http://localhost:" + port);
});
app.use(express.json());

app.use(cors({
    credentials:true,
    origin:["http://localhost:4200"] //4200 for angular app
}));


app.use("/api/users", userRouter)
