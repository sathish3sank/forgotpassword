type CodeT =
  | "DOMAIN_RULE"
  | "BAD_INPUT"
  | "INTERNAL_SERVER_ERROR"
  | "DB_ERROR"
  | "EMAIL_ERROR";

export type CustomError = Error & {
  reason: string;
  code: CodeT;
};

export const makeError =
  (code: CodeT) => (message: string) => (error: string) => {
    const err: CustomError = new Error(message) as CustomError;
    err.code = code;
    err.reason = error;
    return err;
  };

export const makeDomainRuleError = makeError("DOMAIN_RULE");

export const makeBadInputError = makeError("BAD_INPUT");

export const makeInternalServerError = makeError("INTERNAL_SERVER_ERROR");

export const makeDBError = makeError("DB_ERROR");

export const makeEmailError = makeError("EMAIL_ERROR");
