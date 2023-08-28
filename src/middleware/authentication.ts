import { Request, Response, NextFunction } from "express";
import jwt, { Secret, VerifyErrors } from "jsonwebtoken";
import { user } from "@prisma/client";

interface DecodedToken {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  // Add any other properties present in the decoded payload
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Token format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing token." });
  }

  const jwtSecret: Secret | undefined = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res
      .status(500)
      .json({ error: "Internal Server Error: JWT secret is missing." });
  }

  jwt.verify(token, jwtSecret, (err: VerifyErrors | null, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden: Invalid token." });
    }

    // Manually assert the type of the decoded payload
    const typedDecoded = decoded as DecodedToken;

    // Attach user information to the request object
    req.user = {
      id: typedDecoded.id,
      email: typedDecoded.email,
      firstname: typedDecoded.firstname,
      lastname: typedDecoded.lastname,
      role: typedDecoded.role,
    };

    next();
  });
}

function generateTokenResponse(user: user) {
  const token = jwt.sign(
    {
      id: user.iduser,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.roleid,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "30d", // TODO: Consider a shorter expiration time
    }
  );

  return {
    id: user.iduser,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.roleid,
    token: token,
  };
}

export { generateTokenResponse };
export default authenticateToken;
