import dotenv from "dotenv-safe";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import {
  CustomError,
  makeBadInputError,
  makeDBError,
  makeInternalServerError,
} from "./error";
import { EnvT } from "./types";
import { decode, encode } from "base-64";
import express from "express";
import { pipe } from "fp-ts/lib/function";
import { getUserByEmailTE } from "./db/operations";

export const loadEnv = async () => {
  dotenv.config();
  return {
    PORT: Number(process.env.PORT),
    DATABASE_URL: process.env.DATABASE_URL,
    client_id: process.env.client_id,
    project_id: process.env.project_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_secret: process.env.client_secret,
    redirect_uris: process.env.redirect_uris,
    mail_pass: process.env.mail_pass,
    mail_user: process.env.mail_user,
    refresh_token: process.env.refresh_token,
  } as EnvT;
};

export const loadEnvTE = TE.tryCatch(
  () => loadEnv(),
  (reason) => makeInternalServerError("Env loading got failed.")(String(reason))
);

export const encryptPassword = async (password: string) =>
  encode(`${password}`);

export const decryptPassword = async (password: string) => decode(password);

export const encryptPasswordTE = (password: string) =>
  TE.tryCatch(
    () => encryptPassword(password),
    (reason) => makeBadInputError("Encryption error.")(String(reason))
  );

export const decryptPasswordTE = (password: string) =>
  TE.tryCatch(
    () => decryptPassword(password),
    (reason) => makeBadInputError("Decryption error.")(String(reason))
  );

export const pushResponseJson =
  <A = any>(res: express.Response) =>
  async (b: E.Either<CustomError, A>) => {
    if (b._tag == "Left") {
      res.status(500).send({
        type: "error",
        error: {
          message: b.left.message,
          name: b.left.name,
          code: b.left.code,
          reason: b.left.reason,
          stack: b.left.stack,
        },
      });
    } else res.status(200).json({ type: "success", data: b.right });
  };

export const verifyUserTE = (email: string) =>
  pipe(
    getUserByEmailTE(email),
    TE.chainW((userDetails) => {
      return TE.fromEither(
        E.fromNullable(
          makeDBError(`${email} does not exist.`)(`${email} does not exist.`)
        )(userDetails)
      );
    })
  );
