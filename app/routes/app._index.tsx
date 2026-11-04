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

interface ThemeNode {
  id: string;
  name: string;
  role: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Single combined query: products + app config + all themes
  const response = await admin.graphql(
    `#graphql
    query GetHomeData {
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
      themes(first: 20) {
        nodes {
          id
          name
          role
        }
      }
    }`,
  );

  const resJson = await response.json();

  if ((resJson as { errors?: unknown[] }).errors?.length) {
    throw new Response("Failed to load app configuration", { status: 500 });
  }

  // --- Products & saved mappings ---
  const productsList = resJson.data?.products?.nodes ?? [];
  const jsonString = resJson.data?.currentAppInstallation?.metafield?.value;

  let savedMappings: Array<{
    id: string;
    buyProductId: string;
    restrictedProductIds: string[];
  }> = [{ id: "1", buyProductId: "", restrictedProductIds: [] }];

  let hasConfiguredRules = false;

  if (jsonString) {
    try {
      const config = JSON.parse(jsonString);
      if (
        config.ruleType === "product_mapping" &&
        Array.isArray(config.mappings)
      ) {
        savedMappings = config.mappings;
        hasConfiguredRules = config.mappings.some(
          (m: { buyProductId?: string; restrictedProductIds?: string[] }) =>
            Boolean(m.buyProductId && m.restrictedProductIds?.length),
        );
      }
    } catch (error) {
      console.error("JSON parsing error:", error);
    }
  }

  // --- Themes for onboarding theme-selector ---
  const themesData: ThemeNode[] = resJson.data?.themes?.nodes || [];
  const themes = themesData.map((t) => {
    const numericId = t.id.split("/").pop() || "";
    return {
      id: t.id,
      numericId,
      name: t.name,
      role: t.role,
      isLive: t.role.toUpperCase() === "MAIN",
    };
  });

  const liveTheme = themes.find((t) => t.isLive) || themes[0];
  const defaultThemeId = liveTheme?.numericId || "";

  // --- Deep link fragments ---
  const shopName = session.shop.replace(".myshopify.com", "");
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiKey) {
    throw new Response("Shopify API key is not configured", { status: 500 });
  }

  const embedHandle = "app_embed";

  // Legacy single-theme embed URL (kept for compatibility)
  const liveThemeId = defaultThemeId;
  const embedUrl = new URL(
    `https://admin.shopify.com/store/${shopName}/themes/${liveThemeId}/editor`,
  );
  embedUrl.searchParams.set("context", "apps");
  embedUrl.searchParams.set("template", "index");
  embedUrl.searchParams.set("activateAppId", `${apiKey}/${embedHandle}`);

  const checkoutSettingsUrl = `https://admin.shopify.com/store/${shopName}/settings/checkout`;

  return {
    savedMappings,
    products: productsList,
    hasConfiguredRules,
    themes,
    defaultThemeId,
    shopName,
    apiKey,
    embedHandle,
    checkoutSettingsUrl,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StepBadge({ n }: { n: number }) {
  return (
    <span
      style={{
        background: "#005bd3",
        color: "#ffffff",
        borderRadius: "50%",
        width: "26px",
        height: "26px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "13px",
        flexShrink: 0,
      }}
    >
      {n}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  // Onboarding: theme selector state
  const themes = loaderData?.themes || [];
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    loaderData?.defaultThemeId || "",
  );

  const selectedTheme =
    themes.find((t) => t.numericId === selectedThemeId) || themes[0];

  const { shopName, apiKey, embedHandle, checkoutSettingsUrl } = loaderData;

  // Deep link dynamically reflects the selected theme
  const deepLinkUrl = selectedThemeId
    ? `https://admin.shopify.com/store/${shopName}/themes/${selectedThemeId}/editor?context=apps&template=index&activateAppId=${encodeURIComponent(
        `${apiKey}/${embedHandle}`,
      )}`
    : "#";

  return (
    <s-page heading="Cart Control">
      <s-stack gap="base">

        {/* ================================================================
            ONBOARDING SECTION
            Placed at the top per Shopify guidelines: "Provide clear
            post-installation instructions on your app's onboarding page."
            Covers App Embed Block flow:
            1. Prompt to select theme
            2. Screenshots + written instructions
            3. Deep link CTA
            ================================================================ */}
        <s-section heading="Setup: Activate the App Embed on Your Theme">
          <s-stack gap="base">
            <s-paragraph>
              After installing Cart Control, you need to activate the{" "}
              <strong>Cart Restriction Alerts</strong> app embed in your Shopify
              theme to show restriction notices to customers on your storefront.
              This takes less than a minute and requires no code changes.
            </s-paragraph>

            {/* THEME SELECTION — required by Shopify UX guidelines for embed onboarding */}
            <div
              style={{
                border: "1px solid #dcdfe3",
                borderRadius: "8px",
                background: "#fafbfb",
                padding: "16px 20px",
              }}
            >
              <s-stack gap="base">
                <s-select
                  id="themeSelector"
                  label="Select the theme where you want to activate the app embed:"
                  value={selectedThemeId}
                  onChange={(e) => setSelectedThemeId(e.currentTarget.value)}
                >
                  {themes.map((t) => (
                    <s-option key={t.numericId} value={t.numericId}>
                      {t.name}
                      {t.isLive ? " (Live)" : " (Draft)"}
                    </s-option>
                  ))}
                </s-select>

                {selectedTheme && (
                  <s-stack direction="inline" gap="small" alignItems="center">
                    {selectedTheme.isLive ? (
                      <s-badge tone="success">Live / Published</s-badge>
                    ) : (
                      <s-badge tone="info">Draft Theme</s-badge>
                    )}
                    <span style={{ fontSize: "13px", color: "#616161" }}>
                      {selectedTheme.name}
                    </span>
                  </s-stack>
                )}
              </s-stack>
            </div>

            {/* STEP CARDS with screenshots + written instructions */}
            <s-stack gap="base">

              {/* STEP 1 */}
              <div
                style={{
                  border: "1px solid #dcdfe3",
                  borderRadius: "8px",
                  background: "#ffffff",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <s-stack gap="base">
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <StepBadge n={1} />
                    <s-heading>Click &quot;Activate App Embed&quot;</s-heading>
                  </s-stack>

                  <s-paragraph>
                    Use the button below to open the Shopify Theme Editor in a
                    new tab. It will navigate directly to the{" "}
                    <strong>App embeds</strong> panel with Cart Control
                    pre-selected, so you don&apos;t have to search for it.
                  </s-paragraph>

                  <div
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e1e3e5",
                    }}
                  >
                    <img
                      src="/onboarding/step1-activate-embed.png"
                      alt="In the app banner, click the Activate App Embed button"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                  </div>

                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-button
                      href={deepLinkUrl}
                      target="_blank"
                      variant="primary"
                      icon="external"
                    >
                      Activate App Embed
                    </s-button>
                    <span style={{ fontSize: "13px", color: "#616161" }}>
                      Opens theme editor for{" "}
                      <strong>{selectedTheme?.name || "your theme"}</strong>
                    </span>
                  </s-stack>
                </s-stack>
              </div>

              {/* STEP 2 */}
              <div
                style={{
                  border: "1px solid #dcdfe3",
                  borderRadius: "8px",
                  background: "#ffffff",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <s-stack gap="base">
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <StepBadge n={2} />
                    <s-heading>Toggle &quot;Cart Restriction Alerts&quot; to On</s-heading>
                  </s-stack>

                  <s-paragraph>
                    In the Theme Editor sidebar under <strong>App embeds</strong>,
                    find <strong>Cart Restriction Alerts</strong> (listed under{" "}
                    <code>cart-control</code>) and switch its toggle to{" "}
                    <strong>On</strong>.
                  </s-paragraph>

                  <div
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e1e3e5",
                    }}
                  >
                    <img
                      src="/onboarding/step2-toggle-on.png"
                      alt="In App embeds panel, toggle Cart Restriction Alerts to on"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                  </div>
                </s-stack>
              </div>

              {/* STEP 3 */}
              <div
                style={{
                  border: "1px solid #dcdfe3",
                  borderRadius: "8px",
                  background: "#ffffff",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <s-stack gap="base">
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <StepBadge n={3} />
                    <s-heading>Click &quot;Save&quot; in the Theme Editor</s-heading>
                  </s-stack>

                  <s-paragraph>
                    Click the <strong>Save</strong> button in the top-right
                    corner of the Shopify Theme Editor. App embed changes are
                    not published to your storefront until you save.
                  </s-paragraph>

                  <div
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e1e3e5",
                    }}
                  >
                    <img
                      src="/onboarding/step3-click-save.png"
                      alt="Click the Save button in the top-right of the Theme Editor"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                  </div>
                </s-stack>
              </div>

            </s-stack>
          </s-stack>
        </s-section>

        {/* ================================================================
            RULE BUILDER FORM
            ================================================================ */}
        <s-section heading="Add rules to control what goes into the cart">
          <s-stack gap="base">
            <Form method="POST">
              <s-stack gap="base">
                {mappings.map((mapping, index) => (
                  <s-section key={mapping.id}>
                    <s-stack gap="base">
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
        </s-section>

        {/* ================================================================
            CHECKOUT VALIDATION REMINDER
            ================================================================ */}
        <s-section heading="Enable Cart Validation at Checkout">
          <s-stack gap="base">
            <s-paragraph>
              For restrictions to be enforced at checkout, the{" "}
              <strong>cart-validation</strong> function must be active in your
              store settings.
            </s-paragraph>
            <s-ordered-list>
              <s-list-item>
                Go to{" "}
                <s-link href={checkoutSettingsUrl} target="_blank">
                  Shopify Admin → Settings → Checkout
                </s-link>
                .
              </s-list-item>
              <s-list-item>
                Scroll to <strong>Checkout rules / Validation rules</strong>.
              </s-list-item>
              <s-list-item>
                Find <strong>cart-validation (Cart Control)</strong> and confirm
                it is <strong>Active</strong>. Enable it if not.
              </s-list-item>
            </s-ordered-list>
          </s-stack>
        </s-section>

      </s-stack>
    </s-page>
  );
}
