import * as t from "io-ts";
export type EnvT = {
  PORT: number;
  DATABASE_URL: string;
  client_id: string;
  project_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_secret: string;
  redirect_uris: string;
  refresh_token: string;
  mail_user: string;
  mail_pass: string;
};

export const emailT = t.type({
  email: t.string,
});

export type EmailT = t.TypeOf<typeof emailT>;
