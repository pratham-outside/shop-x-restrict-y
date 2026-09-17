import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("Received Shopify webhook:", {
    topic,
    shop,
    payload,
  });

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // Handle customer data request
      console.log("Customer data request:", payload);
      break;

    case "CUSTOMERS_REDACT":
      // Handle customer data deletion
      console.log("Customer redact:", payload);
      break;

    case "SHOP_REDACT":
      // Handle shop data deletion
      console.log("Shop redact:", payload);
      break;

    default:
      console.log(`Unhandled webhook topic: ${topic}`);
  }

  return new Response();
};
