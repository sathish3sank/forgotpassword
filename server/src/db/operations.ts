import { PrismaClient } from "@prisma/client";
import { encryptPassword } from "../helper";
import { UserT } from "./types";
import * as TE from "fp-ts/lib/TaskEither";
import { makeDBError } from "../error";

const userPrisma = new PrismaClient().users;

const saveUser = async ({
  email,
  name,
  password,
  securityQn,
  securityAns,
}: UserT) =>
  userPrisma.create({
    data: {
      email,
      name,
      password,
      securityAns,
      securityQn,
    },
    select: {
      id: true,
      email: true,
    },
  });

export const saveUserTE = (usr: UserT) =>
  TE.tryCatch(
    () => saveUser(usr),
    (reason) => makeDBError("Bad input")(String(reason))
  );

const updatePassword = async (id: string, password: string) =>
  await userPrisma.update({
    where: { id },
    data: { password },
  });

export const updatePasswordTE = (id: string, password: string) =>
  TE.tryCatch(
    () => updatePassword(id, password),
    (reason) => makeDBError("Failed to update password.")(String(reason))
  );

const getsecurityQnForUserId = async (id: string) =>
  await userPrisma.findUnique({
    where: { id },
    select: { id: true, email: true, securityQn: true },
  });

const getsecurityAnForUserId = async (id: string) =>
  await userPrisma.findUnique({
    where: { id },
    select: { id: true, email: true, securityQn: true, securityAns: true },
  });

export const getSecurityQnForEmailTE = (id: string) =>
  TE.tryCatch(
    () => getsecurityQnForUserId(id),
    (reason) =>
      makeDBError("Failed to fetch security questions.")(String(reason))
  );

export const getSecurityAnForEmailTE = (id: string) =>
  TE.tryCatch(
    () => getsecurityAnForUserId(id),
    (reason) => makeDBError("Failed to fetch security answers.")(String(reason))
  );

const getUserByEmail = async (email: string) =>
  await userPrisma.findFirst({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      securityQn: true,
    },
  });

export const getUserByEmailTE = (email: string) =>
  TE.tryCatch(
    () => getUserByEmail(email),
    (reason) => makeDBError("DB error.")(String(reason))
  );
