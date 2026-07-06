import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      const YOUR_FUNCTION_UID = "2191ae4c-a83e-0302-6711-430e435bd21561c660f5";

      try {
        // 1. Activate the Cart Validation Function using the modern 2026-04 mutation
        await admin.graphql(
          `#graphql
      mutation CreateValidation($validation: ValidationCreateInput!) {
        cartValidationCreate(validation: $validation) {
          cartValidation {
            id
          }
        }
      }`,
          {
            variables: {
              validation: {
                functionId: YOUR_FUNCTION_UID,
                title: "Cart Restriction Policy",
              },
            },
          },
        );

        console.log("🚀 App successfully activated and configured on install!");
      } catch (error) {
        console.error("❌ Error running afterAuth hooks:", error);
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
