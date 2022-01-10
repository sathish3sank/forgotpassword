"use strict";

import { loadEnvTE } from "./helper";
import { EnvT } from "./types";
import * as TE from "fp-ts/lib/TaskEither";
import { makeEmailError } from "./error";
import * as nodemailer from "nodemailer";
import { pipe } from "fp-ts/lib/function";
type UnWrapPromise<T> = T extends Promise<infer U> ? U : never;

let makeTransporter = async (env: EnvT) =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: env.mail_user,
      pass: env.mail_pass,
      clientId: env.client_id,
      clientSecret: env.client_secret,
      refreshToken: env.refresh_token,
    },
  } as any);

let makeMailOptions = async (env: EnvT, to: string, text: string) => ({
  from: env.mail_user,
  to,
  subject: "Nodemailer Project",
  text,
});

const makeTransporterTE = (env: EnvT) =>
  TE.tryCatch(
    () => makeTransporter(env),
    (reason) =>
      makeEmailError("Error while creating tranporter.")(String(reason))
  );

const makeMailOptionsTE = (env: EnvT, to: string, text: string) =>
  TE.tryCatch(
    () => makeMailOptions(env, to, text),
    (reason) =>
      makeEmailError("Error while creating mail options.")(String(reason))
  );

const sendEmail = (
  transporter: UnWrapPromise<ReturnType<typeof makeTransporter>>,
  mailOptions: UnWrapPromise<ReturnType<typeof makeMailOptions>>
) =>
  transporter.sendMail(mailOptions, async (err, data) => {
    if (err) {
      console.error(err);
    }
    console.log("Email sent successfully.");
  });

export const sendEmailTE = (to: string, text: string) =>
  pipe(
    loadEnvTE,
    TE.bindTo("env"),
    TE.bindW("transporter", ({ env }) => makeTransporterTE(env)),
    TE.bindW("mailOptions", ({ env }) => makeMailOptionsTE(env, to, text)),
    TE.bindW("successMail", ({ mailOptions, transporter }) =>
      TE.right(sendEmail(transporter, mailOptions))
    ),
    TE.map((_) => true)
  );
