const dotenv = require('dotenv');
dotenv.config();

const {
  CommercetoolsAgentEssentials,
  CommercetoolsAgentEssentialsStreamable,
} = require('@commercetools/agent-essentials/modelcontextprotocol');

const express = require('express');
const { logger } = require('./utils/logger.utils.js');

// Define custom prompts for the MCP server
const MCPPrompts = {
  system: `You are a Commerce Assistant powered by commercetools.
    You can help with managing products, orders, carts, customers, and other commerce data.
    Please provide clear and concise responses about commerce operations.
    
    You have access to multiple tools for working with commercetools data including:
    - Working with products (list_products, products.read, products.create, products.update)
    - Working with categories (read_category, category.read, category.create, category.update)
    - Working with carts (cart.read, cart.create, cart.update)
    - Managing orders (order.read, order.create, order.update)
    - Working with customers (customer.read, customer.create, customer.update)
    - Searching products (search_products)
    - Managing product types (read_product_type, product-type.read)
    - Getting project information (read_project, project.read)
    - And many more tools for working with commercetools APIs`,
  examples: [
    {
      input: "Show me information about product with ID 123",
      output: "I'll use the products.read tool to get that information for you. Here's the product information you requested: [product details]"
    },
    {
      input: "Create a new cart for customer Smith",
      output: "I'll use the cart.create tool to create a new cart. I've created a new cart for customer Smith. The cart ID is: [cart ID]"
    },
    {
      input: "List all categories in the store",
      output: "I'll use the category.read tool to fetch the categories. Here are the categories in your store: [categories list]"
    },
    {
      input: "Search for products containing 'shirt'",
      output: "I'll use the search_products tool to search for products. Here are the products matching your search for 'shirt': [search results]"
    },
    {
      input: "Tell me about my project settings",
      output: "I'll use the read_project tool to get your project information. Here are your project settings: [project details]"
    }
  ]
};

const env = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  authUrl: process.env.AUTH_URL,
  projectKey: process.env.PROJECT_KEY,
  apiUrl: process.env.API_URL,
  stateless: process.env.STATELESS === 'true',
  accessToken: process.env.ACCESS_TOKEN,
  authType: process.env.AUTH_TYPE,
  tools: process.env.TOOLS,
  isAdmin: process.env.IS_ADMIN === 'true'
};

// Force isAdmin to true to try to get more tools
env.isAdmin = true;

console.log("env",env);

const ACCEPTED_TOOLS = [
  'business-unit.read',
  'business-unit.create',
  'business-unit.update',
  'products.read',
  'products.create',
  'products.update',
  'project.read',
  'product-search.read',
  'category.read',
  'category.create',
  'category.update',
  'channel.read',
  'channel.create',
  'channel.update',
  'product-selection.read',
  'product-selection.create',
  'product-selection.update',
  'order.read',
  'order.create',
  'order.update',
  'cart.read',
  'cart.create',
  'cart.update',
  'customer.create',
  'customer.read',
  'customer.update',
  'customer-group.read',
  'customer-group.create',
  'customer-group.update',
  'quote.read',
  'quote.create',
  'quote.update',
  'quote-request.read',
  'quote-request.create',
  'quote-request.update',
  'staged-quote.read',
  'staged-quote.create',
  'staged-quote.update',
  'standalone-price.read',
  'standalone-price.create',
  'standalone-price.update',
  'product-discount.read',
  'product-discount.create',
  'product-discount.update',
  'cart-discount.read',
  'cart-discount.create',
  'cart-discount.update',
  'discount-code.read',
  'discount-code.create',
  'discount-code.update',
  'product-type.read',
  'product-type.create',
  'product-type.update',
  'bulk.create',
  'bulk.update',
  'inventory.read',
  'inventory.create',
  'inventory.update',
  'store.read',
  'store.create',
  'store.update',
];

// NOTE: While all the above tools are configured when TOOLS=all,
// the MCP Essentials SDK (v2.0.0) may only expose a subset of these tools 
// directly in the MCP API. This is expected behavior. The most common tools
// like read_category, list_products, read_project, search_products, read_product_type
// are exposed directly, while others might be available but not shown in tool listings.

const getAuthConfig = (env) => {
  const baseConfig = {
    authUrl: env.authUrl,
    projectKey: env.projectKey,
    apiUrl: env.apiUrl,
  };

  console.log("authtype",env.authType);

  switch (env.authType) {
    case 'client_credentials':
      return {
        type: 'client_credentials',
        clientId: env.clientId,
        clientSecret: env.clientSecret,
        ...baseConfig,
      };
    case 'auth_token':
      return {
        type: 'auth_token',
        accessToken: env.accessToken,
        ...baseConfig,
      };
    default:
      throw new Error(`Unsupported auth type: ${env.authType}`);
  }
};

const app = express();

const selectedTools = env.tools ? env.tools.split(',').map((tool) => tool.trim()) : [];
const configuration = {
  actions: {},
  context: {
    isAdmin: env.isAdmin
  },
};

if (selectedTools[0] === 'all') {
  ACCEPTED_TOOLS.forEach((tool) => {
    if (!configuration.actions) {
      configuration.actions = {};
    }
    const [namespace, action] = tool.split('.');
    configuration.actions[namespace] = {
      ...configuration.actions[namespace],
      [action]: true,
    };
  });
} else if (selectedTools[0] === 'all.read') {
  ACCEPTED_TOOLS.forEach((tool) => {
    if (!configuration.actions) {
      configuration.actions = {};
    }
    const [namespace, action] = tool.split('.');
    if (action === 'read') {
      configuration.actions[namespace] = {
        ...configuration.actions[namespace],
        [action]: true,
      };
    }
  });
} else {
  selectedTools.forEach((tool) => {
    if (!configuration.actions) {
      configuration.actions = {};
    }
    const [namespace, action] = tool.split('.');
    configuration.actions[namespace] = {
      ...(configuration.actions[namespace] || {}),
      [action]: true,
    };
  });
}


const agentServer = new CommercetoolsAgentEssentials({
  authConfig: getAuthConfig(env),
  configuration,
});

// Log the available tools
console.log("Agent server tools:", Object.keys(agentServer.tools || {}));

const serverStreamable = new CommercetoolsAgentEssentialsStreamable({
  stateless: false, // Force stateful mode
  streamableHttpOptions: {
    sessionIdGenerator: undefined,
  },
  server: agentServer,
  app: app,
  // Add enhanced prompts configuration
  prompts: MCPPrompts,
  // Set debug to true to get more information
  debug: true
});

// Log the actual configured tools
console.log("Configured tools:", JSON.stringify(configuration.actions, null, 2));

// Log the prompts
console.log("Prompts configuration:", JSON.stringify({
  systemPromptLength: MCPPrompts.system.length,
  examplesCount: MCPPrompts.examples.length,
  firstExample: MCPPrompts.examples[0]
}, null, 2));

// Set port with fallback to 8080
const PORT = process.env.PORT || 8080;
serverStreamable.listen(PORT, () => {
  logger.info(`⚡️ MCP server listening on port ${PORT}`);
});

module.exports = serverStreamable;
