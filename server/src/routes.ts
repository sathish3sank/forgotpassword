import express from "express";
import {
  encryptPasswordTE,
  loadEnvTE,
  pushResponseJson,
  verifyUserTE,
} from "./helper";
import * as TE from "fp-ts/lib/TaskEither";
import { CustomError, makeBadInputError, makeDBError } from "./error";
import { emailT, EnvT } from "./types";
import { pipe } from "fp-ts/lib/function";
import {
  getSecurityAnForEmailTE,
  getUserByEmailTE,
  updatePasswordTE,
} from "./db/operations";
import { sendEmailTE } from "./mailer";

export const bootstrapPasswordRoutes = (env: EnvT) => {
  const router = express.Router();

  router.post("/reset", async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      res
        .status(403)
        .json({ type: "error", message: "Please provide email id." });
    }

    const update = await pipe(
      verifyUserTE(email),
      TE.bindTo("user"),
      TE.bindW("pass", (_) => encryptPasswordTE(password)),
      TE.bindW("updatedUser", ({ user, pass }) => {
        console.log(user, pass);
        return updatePasswordTE(user.id, pass);
      }),
      TE.map((_) => "Password has been updated successfully.")
    )();
    pushResponseJson(res)(update);
  });

  router.post("/getSecurityQns", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res
        .status(500)
        .send({ type: "error", message: "Please provide email id." });
    }
    const sqn = await verifyUserTE(email)();
    pushResponseJson(res)(sqn);
  });

  router.post("/verifySecurityAns", async (req, res) => {
    const { email, securityAns } = req.body;
    if (!email) {
      res
        .status(500)
        .send({ type: "error", message: "Please provide email id." });
    }
    const sqn = await pipe(
      verifyUserTE(email),
      TE.chainW((user) => getSecurityAnForEmailTE(user.id)),
      TE.bindTo("user"),
      TE.bindW("predicate", ({ user }) =>
        TE.right(user?.securityAns == securityAns)
      ),
      TE.bindW("sentEmail", ({ predicate, user }) =>
        predicate
          ? pipe(
              sendEmailTE(
                email,
                `You can reset your password using http://localhost:9000/api/password/reset. Thanks.`
              ),
              TE.map(() => "Mail has been sent successfully")
            )
          : TE.left(makeDBError("Security answers mismatch.")(`${securityAns}`))
      )
    )();
    pushResponseJson(res)(sqn);
  });

  return router;
};
