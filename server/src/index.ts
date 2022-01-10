import express from "express";
import { pipe } from "fp-ts/lib/function";
import { loadEnvTE } from "./helper";
import * as TE from "fp-ts/lib/TaskEither";
import cors from "cors";
import morgan from "morgan";
import { bootstrapPasswordRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(cors());
app.use(morgan("dev"));

const stratServer = (port: number) =>
  app.listen(port, () => console.log(`App running in ${port}`));

const bootstrapDependents = pipe(
  loadEnvTE,
  TE.bindTo("env"),
  TE.bindW("router", ({ env }) => TE.right(bootstrapPasswordRoutes(env))),
  TE.chainFirstW(({ router }) => {
    app.use("/api/password", router);
    return TE.right(app);
  }),
  TE.bindW("server", ({ env }) => TE.right(stratServer(env.PORT)))
);

bootstrapDependents();
