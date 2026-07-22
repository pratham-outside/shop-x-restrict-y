import { RunInput, CartValidationsGenerateRunResult } from "../generated/api";

const NO_ERRORS: CartValidationsGenerateRunResult = { operations: [] };

export function cartValidationsGenerateRun(
  input: RunInput,
): CartValidationsGenerateRunResult {
  const configurationMetafield = input.validation?.metafield?.value;

  if (!configurationMetafield) return NO_ERRORS;

  const configuration = JSON.parse(configurationMetafield);

  if (
    configuration.ruleType !== "product_mapping" ||
    !Array.isArray(configuration.mappings)
  ) {
    return NO_ERRORS;
  }

  const lines = input.cart.lines;

  // 🌟 Loop through each active rule set configured by the merchant
  for (const mapping of configuration.mappings) {
    const { buyProductId, restrictedProductIds } = mapping as {
      buyProductId: string;
      restrictedProductIds: string[];
    };

    // Check if the current rule's trigger product is in the cart
    const holdsTriggerProduct = lines.some(
      (line) =>
        line.merchandise.__typename === "ProductVariant" &&
        line.merchandise.product.id === buyProductId,
    );

    // If this specific trigger is present, check for its mapped restricted items
    if (holdsTriggerProduct) {
      for (const line of lines) {
        if (line.merchandise.__typename !== "ProductVariant") continue;

        if (restrictedProductIds.includes(line.merchandise.product.id)) {
          return {
            operations: [
              {
                validationAdd: {
                  errors: [
                    {
                      message:
                        "Restricted Combo: Mapped items cannot be purchased together.",
                      target: "cart",
                    },
                  ],
                },
              },
            ],
          };
        }
      }
    }
  }

  return NO_ERRORS;
}
