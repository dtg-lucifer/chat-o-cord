import express from "express";
import type { Request, Response } from "express";
import { validationResult } from "express-validator";

import { registerUser, loginUser } from "../auth/auth.service";

export const authRouter = express.Router();

authRouter.post("/register", async (req: Request, res: Response) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) return res.status(422).send(errors.array());

  const { email, firstName, lastName, password } = req.body;
  return registerUser({ email, password, firstName, lastName })
    .then((user) => {
      // @ts-ignore
      req.session.user = user;
      res.status(201).json(user);
    })
    .catch((err) => res.status(500).json(err));
});

authRouter.get("/me", async (req: Request, res: Response) => {
  // @ts-ignore
  if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });
  // @ts-ignore
  return res.status(200).json(req.session.user);
});