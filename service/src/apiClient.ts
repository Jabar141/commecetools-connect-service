import { ClientBuilder } from '@commercetools/sdk-client-v2';
import { ApiRoot, createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import fetch from "node-fetch";
require('dotenv').config();

export const projectKey = process.env.CTP_PROJECT_KEY ?? "honda-ct-dev-01";
const clientId = process.env.CTP_CLIENT_ID ?? "8kZra7OhcYqWzcBIBUHMF_p0";
const clientSecret = process.env.CTP_CLIENT_SECRET ?? "gtT2WCdhtIznF94U5mRohdMb_I-gTkxy";
const apiUrl = process.env.CTP_API_URL ?? "https://api.us-central1.gcp.commercetools.com";
const authUrl = process.env.CTP_AUTH_URL ?? "https://auth.us-central1.gcp.commercetools.com";

const authMiddlewareOptions = {
  host: authUrl,
  projectKey,
  credentials: {
    clientId,
    clientSecret,
  },
  scopes: [`manage_project:${projectKey}`],
};

const httpMiddlewareOptions = {
  host: apiUrl,
  fetch,
};

const client = new ClientBuilder()
  .withProjectKey(projectKey)
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withUserAgentMiddleware()
  .build();

export const apiRoot: ApiRoot = createApiBuilderFromCtpClient(client);

