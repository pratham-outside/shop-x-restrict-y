import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  useActionData,
  Form,
  useLoaderData,
  useNavigation,
} from "react-router";
import { authenticate } from "../shopify.server";

import { ProductMultiSelect } from "../components/ProductMultiSelect";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const [response, themeEditorResponse] = await Promise.all([
    admin.graphql(
      `#graphql
      query GetAppConfiguration {
        currentAppInstallation {
          id
          metafield(
            namespace: "cart_restriction_app"
            key: "configuration"
          ) {
            value
          }
        }
        products(first: 50) {
          nodes {
            id
            title
          }
        }
      }`,
    ),
    admin.graphql(
      `#graphql
      query GetActiveTheme {
        themes(first: 10, roles: [MAIN]) {
          nodes {
            id
            role
          }
        }
      }`,
    ),
  ]);

  const [resJson, themeJson] = await Promise.all([
    response.json(),
    themeEditorResponse.json(),
  ]);

  if (
    (resJson as { errors?: unknown[] }).errors?.length ||
    (themeJson as { errors?: unknown[] }).errors?.length
  ) {
    throw new Response("Failed to load Shopify configuration", {
      status: 500,
    });
  }

  const jsonString = resJson.data?.currentAppInstallation?.metafield?.value;

  const productsList = resJson.data?.products?.nodes ?? [];

  let savedMappings = [
    {
      id: "1",
      buyProductId: "",
      restrictedProductIds: [],
    },
  ];

  if (jsonString) {
    try {
      const config = JSON.parse(jsonString);

      if (
        config.ruleType === "product_mapping" &&
        Array.isArray(config.mappings)
      ) {
        savedMappings = config.mappings;
      }
    } catch (error) {
      console.error("JSON parsing error:", error);
    }
  }

  const fullGid = themeJson.data?.themes?.nodes?.[0]?.id;

  if (!fullGid) {
    throw new Response("No active theme found", { status: 404 });
  }

  const themeId = fullGid.split("/").pop();

  // Use the Shopify app API key/client ID.
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiKey) {
    throw new Response("Shopify API key is not configured", {
      status: 500,
    });
  }

  // Must match your app embed block's handle.
  const embedHandle = "app_embed";

  const shopName = session.shop.replace(".myshopify.com", "");

  const url = new URL(
    `https://admin.shopify.com/store/${shopName}/themes/${themeId}/editor`,
  );

  url.searchParams.set("context", "apps");
  url.searchParams.set("template", "index");
  url.searchParams.set("activateAppId", `${apiKey}/${embedHandle}`);

  const embedUrl = url.toString();

  return {
    savedMappings,
    products: productsList,
    embedUrl,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const buyProductIds = formData.getAll("buyProductId") as string[];
  const mappings: Array<{
    buyProductId: string;
    restrictedProductIds: string[];
  }> = [];

  for (let i = 0; i < buyProductIds.length; i++) {
    const buyProductId = buyProductIds[i];
    const restrictedProductIds = formData.getAll(
      `restrictedProductIds_${i}`,
    ) as string[];

    if (!buyProductId || restrictedProductIds.length === 0) {
      return {
        error: `Ruleset Combo #${i + 1} requires both a trigger product and at least one restriction selection.`,
      };
    }
    mappings.push({ buyProductId, restrictedProductIds });
  }

  try {
    const currentAppQuery = await admin.graphql(
      `#graphql
      query GetAppAndValidations {
        currentAppInstallation { id }
        validations(first: 1) { edges { node { id } } }
      }`,
    );

    const currentAppRes = await currentAppQuery.json();
    const appInstallationId = currentAppRes.data?.currentAppInstallation?.id;
    const cartValidationId =
      currentAppRes.data?.validations?.edges[0]?.node?.id;

    const configPayload = { ruleType: "product_mapping", mappings };
    const metafields = [
      {
        namespace: "cart_restriction_app",
        key: "configuration",
        type: "json",
        value: JSON.stringify(configPayload),
        ownerId: appInstallationId,
      },
    ];

    if (cartValidationId) {
      metafields.push({
        namespace: "$app:cart_restriction",
        key: "configuration",
        type: "json",
        value: JSON.stringify(configPayload),
        ownerId: cartValidationId,
      });
    }

    await admin.graphql(
      `#graphql
      mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { userErrors { message } }
      }`,
      { variables: { metafields } },
    );

    return {
      success: true,
      message: "All restriction mappings successfully saved!",
    };
  } catch (err) {
    return { error: "Internal server error saving configuration entries." };
  }
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (actionData?.success || actionData?.error) {
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const products: { id: string; title: string }[] = loaderData?.products || [];
  const url = loaderData?.embedUrl || "#";

  const [mappings, setMappings] = useState<
    Array<{ id: string; buyProductId: string; restrictedProductIds: string[] }>
  >(
    loaderData?.savedMappings?.map((m, idx) => ({
      ...m,
      id: String(idx + 1),
    })) || [{ id: "1", buyProductId: "", restrictedProductIds: [] }],
  );

  const addRow = () => {
    if (mappings.length >= 3) return;
    setMappings([
      ...mappings,
      { id: String(Date.now()), buyProductId: "", restrictedProductIds: [] },
    ]);
  };

  const removeRow = (id: string) => {
    if (mappings.length === 1) {
      setMappings([{ id: "1", buyProductId: "", restrictedProductIds: [] }]);
      return;
    }
    setMappings(mappings.filter((m) => m.id !== id));
  };

  const updateRow = (
    id: string,
    key: "buyProductId" | "restrictedProductIds",
    value: string | string[],
  ) => {
    setMappings(
      mappings.map((m) => (m.id === id ? { ...m, [key]: value } : m)),
    );
  };

  return (
    <s-page heading="Cart Control : Add rules to control what goes into the cart">
      <s-stack gap="base">
        {/* APP EMBED BANNER */}
        <s-banner tone="info" heading="Enable App Embed">
          <s-paragraph>
            To apply restriction rules, embed the Cart Restriction App in your
            Shopify theme editor. Need guidance? View our{" "}
            <s-link href="/app/onboarding">step-by-step Onboarding Guide</s-link>.
          </s-paragraph>
          <s-button
            slot="secondary-actions"
            href={url}
            target="_blank"
            icon="external"
          >
            Activate App Embed
          </s-button>
        </s-banner>

        {/* CONFIGURATION FORM */}
        <Form method="POST">
          <s-stack gap="base">
            {mappings.map((mapping, index) => (
              <s-section key={mapping.id}>
                <s-stack gap="base">
                  {/* REMOVE BUTTON */}
                  <s-stack direction="inline" justifyContent="space-between">
                    <s-heading>Ruleset Combo #{index + 1}</s-heading>
                    <s-button
                      type="button"
                      onClick={() => removeRow(mapping.id)}
                      tone="critical"
                      variant="secondary"
                    >
                      Remove Rule
                    </s-button>
                  </s-stack>

                  {/* BUY DROPDOWN */}
                  <s-select
                    id={`buyProduct-${mapping.id}`}
                    name="buyProductId"
                    label="Select Buy Product:"
                    value={mapping.buyProductId}
                    onChange={(e) =>
                      updateRow(
                        mapping.id,
                        "buyProductId",
                        e.currentTarget.value,
                      )
                    }
                    placeholder="Choose Core Product"
                    required
                  >
                    {products.map((p) => (
                      <s-option key={p.id} value={p.id}>
                        {p.title}
                      </s-option>
                    ))}
                  </s-select>

                  <ProductMultiSelect
                    index={index}
                    buyProductId={mapping.buyProductId}
                    selectedIds={mapping.restrictedProductIds}
                    products={products}
                    onChange={(options) =>
                      updateRow(mapping.id, "restrictedProductIds", options)
                    }
                  />
                </s-stack>
              </s-section>
            ))}

            <s-box>
              <s-stack
                direction="inline"
                justifyContent="space-between"
                alignItems="center"
              >
                {mappings.length < 3 ? (
                  <s-button type="button" onClick={addRow} variant="secondary">
                    Add New Rule Set
                  </s-button>
                ) : (
                  <s-box />
                )}

                <s-button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                >
                  Save All Rules
                </s-button>
              </s-stack>
            </s-box>
          </s-stack>
        </Form>

        {/* SERVER MESSAGES */}
        {showBanner && actionData?.success && (
          <s-banner tone="success" heading="Success">
            <s-paragraph>{actionData.message}</s-paragraph>
          </s-banner>
        )}
        {showBanner && actionData?.error && (
          <s-banner tone="critical" heading="Error">
            <s-paragraph>{actionData.error}</s-paragraph>
          </s-banner>
        )}
      </s-stack>
    </s-page>
  );
}
