const {ClientBuilder} = require('@commercetools/sdk-client-v2');
const {createApiBuilderFromCtpClient} = require('@commercetools/platform-sdk');
const fetch  = require('node-fetch');
require('dotenv').config();

module.exports.projectKey = process.env.CTP_PROJECT_KEY ?? "honda-ct-dev-01";
const projectKey1 = process.env.CTP_PROJECT_KEY ?? "honda-ct-dev-01";
const clientId = process.env.CTP_CLIENT_ID ?? "8kZra7OhcYqWzcBIBUHMF_p0";
const clientSecret = process.env.CTP_CLIENT_SECRET ?? "gtT2WCdhtIznF94U5mRohdMb_I-gTkxy";
const apiUrl = process.env.CTP_API_URL ?? "https://api.us-central1.gcp.commercetools.com";
const authUrl = process.env.CTP_AUTH_URL ?? "https://auth.us-central1.gcp.commercetools.com";

const authMiddlewareOptions = {
  host: authUrl,
  projectKey1,
  credentials: {
    clientId,
    clientSecret,
  },
  scopes: [`manage_project:${projectKey1}`],
};

const httpMiddlewareOptions = {
  host: apiUrl,
  fetch,
};

const client = new ClientBuilder()
  .withProjectKey(projectKey1)
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withUserAgentMiddleware()
  .build();

module.exports.apiRoot = createApiBuilderFromCtpClient(client);

