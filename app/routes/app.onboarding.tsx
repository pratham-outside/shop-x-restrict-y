import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

interface ThemeNode {
  id: string;
  name: string;
  role: string;
  processing: boolean;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query GetAppConfigAndThemes {
      currentAppInstallation {
        id
        metafield(
          namespace: "cart_restriction_app"
          key: "configuration"
        ) {
          value
        }
      }
      themes(first: 20) {
        nodes {
          id
          name
          role
          processing
        }
      }
    }`,
  );

  const resJson = await response.json();

  if ((resJson as { errors?: unknown[] }).errors?.length) {
    throw new Response("Failed to load store themes and configuration", {
      status: 500,
    });
  }

  const themesData: ThemeNode[] = resJson.data?.themes?.nodes || [];
  const configString =
    resJson.data?.currentAppInstallation?.metafield?.value || null;

  let hasConfiguredRules = false;
  if (configString) {
    try {
      const parsed = JSON.parse(configString);
      if (
        parsed.ruleType === "product_mapping" &&
        Array.isArray(parsed.mappings) &&
        parsed.mappings.length > 0 &&
        parsed.mappings.some(
          (m: { buyProductId?: string; restrictedProductIds?: string[] }) =>
            Boolean(m.buyProductId && m.restrictedProductIds?.length),
        )
      ) {
        hasConfiguredRules = true;
      }
    } catch {
      hasConfiguredRules = false;
    }
  }

  const shopName = session.shop.replace(".myshopify.com", "");
  const shopDomain = session.shop;
  const apiKey =
    process.env.SHOPIFY_API_KEY || "81dc38a6886e9463901268bdde6d9825";
  const embedHandle = "app_embed";

  // Parse themes with numeric IDs
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

  // Find the primary/live theme ID, default to first theme if none marked MAIN
  const liveTheme = themes.find((t) => t.isLive) || themes[0];
  const defaultThemeId = liveTheme?.numericId || "";

  return {
    themes,
    defaultThemeId,
    shopName,
    shopDomain,
    apiKey,
    embedHandle,
    hasConfiguredRules,
  };
};

export default function OnboardingPage() {
  const {
    themes,
    defaultThemeId,
    shopName,
    apiKey,
    embedHandle,
    hasConfiguredRules,
  } = useLoaderData<typeof loader>();

  const [selectedThemeId, setSelectedThemeId] = useState<string>(defaultThemeId);

  const selectedTheme =
    themes.find((t) => t.numericId === selectedThemeId) || themes[0];

  // Construct dynamic deep link to Shopify Theme Editor according to guidelines
  const deepLinkUrl = selectedThemeId
    ? `https://admin.shopify.com/store/${shopName}/themes/${selectedThemeId}/editor?context=apps&template=index&activateAppId=${encodeURIComponent(
        `${apiKey}/${embedHandle}`,
      )}`
    : "#";

  const checkoutSettingsUrl = `https://admin.shopify.com/store/${shopName}/settings/checkout`;

  return (
    <s-page heading="Merchant Onboarding & Setup">
      <s-stack gap="base">
        {/* WELCOME / HERO BANNER */}
        <s-banner tone="info" heading="Welcome to Cart Control!">
          <s-paragraph>
            Follow this quick step-by-step setup guide to connect the app with your
            Online Store theme, activate real-time cart restriction alerts, and
            protect your inventory workflows.
          </s-paragraph>
        </s-banner>

        {/* ONBOARDING CHECKLIST OVERVIEW */}
        <s-section heading="📋 Setup Progress Checklist">
          <s-stack gap="small">
            <div
              style={{
                background: "#f7fafc",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <span style={{ fontSize: "18px" }}>✅</span>
                  <div>
                    <strong>Step 1: Install App & Grant Permissions</strong>
                    <p style={{ margin: "2px 0 0", color: "#616161", fontSize: "13px" }}>
                      App is successfully installed on your store.
                    </p>
                  </div>
                </s-stack>
                <s-badge tone="success">Completed</s-badge>
              </s-stack>
            </div>

            <div
              style={{
                background: "#f7fafc",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <span style={{ fontSize: "18px" }}>🎨</span>
                  <div>
                    <strong>Step 2: Activate App Embed in Theme Editor</strong>
                    <p style={{ margin: "2px 0 0", color: "#616161", fontSize: "13px" }}>
                      Enables customer-facing restriction alerts on your storefront.
                    </p>
                  </div>
                </s-stack>
                <s-badge tone="warning">Required Action</s-badge>
              </s-stack>
            </div>

            <div
              style={{
                background: "#f7fafc",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <span style={{ fontSize: "18px" }}>⚙️</span>
                  <div>
                    <strong>Step 3: Verify Checkout & Cart Validation Rule</strong>
                    <p style={{ margin: "2px 0 0", color: "#616161", fontSize: "13px" }}>
                      Enforces restriction checks at the cart and checkout level.
                    </p>
                  </div>
                </s-stack>
                <s-badge tone="info">Recommended</s-badge>
              </s-stack>
            </div>

            <div
              style={{
                background: "#f7fafc",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <span style={{ fontSize: "18px" }}>🛒</span>
                  <div>
                    <strong>Step 4: Configure Product Restriction Rules</strong>
                    <p style={{ margin: "2px 0 0", color: "#616161", fontSize: "13px" }}>
                      Define which products trigger cart restrictions.
                    </p>
                  </div>
                </s-stack>
                {hasConfiguredRules ? (
                  <s-badge tone="success">Configured</s-badge>
                ) : (
                  <s-badge tone="warning">Pending Rules</s-badge>
                )}
              </s-stack>
            </div>
          </s-stack>
        </s-section>

        {/* STEP 1: THEME APP EMBED ACTIVATION (FOLLOWING SHOPIFY UX GUIDELINES) */}
        <s-section heading="Theme App Embed Activation">
          <s-stack gap="base">
            <s-paragraph>
              Theme app extensions allow our app to display clean, native alert
              modals when a customer attempts to add restricted items to their
              cart—<strong>without touching any theme code</strong>. Follow the
              3 steps below to activate the app embed in your store.
            </s-paragraph>

            {/* THEME SELECTION PROMPT - Required by Shopify UX guidelines */}
            <div
              style={{
                border: "1px solid #dcdfe3",
                borderRadius: "8px",
                background: "#ffffff",
                padding: "20px",
              }}
            >
              <s-stack gap="base">
                <div>
                  <s-heading>Select Target Theme</s-heading>
                  <p style={{ margin: "4px 0 12px", color: "#616161", fontSize: "13px" }}>
                    Choose the theme where you want to preview and activate the{" "}
                    <strong>Cart Restriction Alerts</strong> app embed:
                  </p>
                  <s-select
                    id="themeSelector"
                    label="Select Theme:"
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.currentTarget.value)}
                  >
                    {themes.map((t) => (
                      <s-option key={t.numericId} value={t.numericId}>
                        {t.name} {t.isLive ? " (Live / Published)" : " (Draft)"}
                      </s-option>
                    ))}
                  </s-select>
                </div>

                {selectedTheme && (
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <span style={{ fontSize: "13px", color: "#616161" }}>
                      Selected theme: <strong>{selectedTheme.name}</strong>
                    </span>
                    {selectedTheme.isLive ? (
                      <s-badge tone="success">Current Live Theme</s-badge>
                    ) : (
                      <s-badge tone="info">Draft Theme</s-badge>
                    )}
                  </s-stack>
                )}
              </s-stack>
            </div>

            {/* THREE DETAILED STEPS WITH HIGHLIGHTED SCREENSHOTS */}
            <s-stack gap="base">
              {/* STEP 1 WALKTHROUGH CARD */}
              <div
                style={{
                  border: "1px solid #dcdfe3",
                  borderRadius: "8px",
                  background: "#ffffff",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              >
                <s-stack gap="base">
                  <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <span
                        style={{
                          background: "#005bd3",
                          color: "#ffffff",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        1
                      </span>
                      <s-heading>Click &quot;Activate App Embed&quot;</s-heading>
                    </s-stack>
                    <s-badge tone="info">Deep Link</s-badge>
                  </s-stack>

                  <s-paragraph>
                    Click the <strong>Activate App Embed</strong> button. This deep link
                    opens the Shopify Theme Editor in a new tab and automatically
                    navigates directly to the <strong>App embeds</strong> panel with our
                    extension targeted.
                  </s-paragraph>

                  {/* Screenshot 1 */}
                  <div
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e1e3e5",
                      background: "#fafafa",
                    }}
                  >
                    <img
                      src="/onboarding/step1-activate-embed.png"
                      alt="Step 1: Click here to embed theme extension"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </div>

                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-button
                      href={deepLinkUrl}
                      target="_blank"
                      variant="primary"
                      icon="external"
                    >
                      Activate App Embed ➔
                    </s-button>
                    <s-paragraph>
                      <em>
                        Opens theme editor for:{" "}
                        <strong>{selectedTheme?.name || "your theme"}</strong>
                      </em>
                    </s-paragraph>
                  </s-stack>
                </s-stack>
              </div>

              {/* STEP 2 WALKTHROUGH CARD */}
              <div
                style={{
                  border: "1px solid #dcdfe3",
                  borderRadius: "8px",
                  background: "#ffffff",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              >
                <s-stack gap="base">
                  <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <span
                        style={{
                          background: "#005bd3",
                          color: "#ffffff",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        2
                      </span>
                      <s-heading>Toggle to turn on</s-heading>
                    </s-stack>
                    <s-badge tone="warning">Action in Theme Editor</s-badge>
                  </s-stack>

                  <s-paragraph>
                    In the Theme Editor sidebar under <strong>App embeds</strong>, locate{" "}
                    <strong>Cart Restriction Alerts</strong> (under <code>cart-control</code>).
                    Switch the toggle to <strong>ON</strong>.
                  </s-paragraph>

                  {/* Screenshot 2 */}
                  <div
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e1e3e5",
                      background: "#fafafa",
                    }}
                  >
                    <img
                      src="/onboarding/step2-toggle-on.png"
                      alt="Step 2: Toggle to turn on Cart Restriction Alerts"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </div>
                </s-stack>
              </div>

              {/* STEP 3 WALKTHROUGH CARD */}
              <div
                style={{
                  border: "1px solid #dcdfe3",
                  borderRadius: "8px",
                  background: "#ffffff",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              >
                <s-stack gap="base">
                  <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <span
                        style={{
                          background: "#005bd3",
                          color: "#ffffff",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                        }}
                      >
                        3
                      </span>
                      <s-heading>Click &quot;Save&quot; to apply changes</s-heading>
                    </s-stack>
                    <s-badge tone="success">Final Theme Step</s-badge>
                  </s-stack>

                  <s-paragraph>
                    Click the <strong>Save</strong> button in the top-right header of the
                    Shopify Theme Editor. Theme customizations remain inactive on your store
                    until you explicitly click Save.
                  </s-paragraph>

                  {/* Screenshot 3 */}
                  <div
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #e1e3e5",
                      background: "#fafafa",
                    }}
                  >
                    <img
                      src="/onboarding/step3-click-save.png"
                      alt="Step 3: Click here to save in theme editor"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </div>
                </s-stack>
              </div>
            </s-stack>
          </s-stack>
        </s-section>

        {/* STEP 2: CHECKOUT & CART VALIDATION FUNCTION */}
        <s-section heading="Checkout & Cart Validation Rule">
          <s-stack gap="base">
            <s-paragraph>
              Cart Control uses Shopify&apos;s native Cart and Checkout Validation
              APIs to strictly block restricted combinations before order submission.
            </s-paragraph>

            <s-ordered-list>
              <s-list-item>
                Navigate to your store settings by clicking{" "}
                <s-link href={checkoutSettingsUrl} target="_blank">
                  Shopify Settings ➔ Checkout
                </s-link>
                .
              </s-list-item>
              <s-list-item>
                Scroll down to the <strong>Checkout rules / Validation rules</strong>{" "}
                section.
              </s-list-item>
              <s-list-item>
                Find <strong>cart-validation</strong> (Cart Control) and confirm its
                status is set to <strong>Active</strong>.
              </s-list-item>
              <s-list-item>
                If disabled, click the row to enable it and press <strong>Save</strong>.
              </s-list-item>
            </s-ordered-list>
          </s-stack>
        </s-section>

        {/* STEP 3: CONFIGURE RESTRICTION RULES */}
        <s-section heading="Define Your Restriction Rules">
          <s-stack gap="base">
            <s-paragraph>
              Now that your storefront theme embed and checkout validation engine are
              active, set up your product mapping rules on the Home dashboard.
            </s-paragraph>

            <div
              style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <s-stack gap="small">
                <s-heading>How Rules Work:</s-heading>
                <s-unordered-list>
                  <s-list-item>
                    <strong>Buy Product (Anchor):</strong> The core item in the cart
                    that triggers restrictions.
                  </s-list-item>
                  <s-list-item>
                    <strong>Restricted Products:</strong> Items that cannot be added
                    when the anchor product is present.
                  </s-list-item>
                  <s-list-item>
                    <strong>Customer Experience:</strong> If a shopper tries to add a
                    restricted item, our App Embed pops up a clear notice and halts
                    the cart addition.
                  </s-list-item>
                </s-unordered-list>
              </s-stack>
            </div>

            <s-stack direction="inline" gap="base">
              <s-button href="/app" variant="primary">
                Go to Rule Builder (Home) ➔
              </s-button>
            </s-stack>
          </s-stack>
        </s-section>

        {/* TESTING & VERIFICATION */}
        <s-section heading="🧪 Testing Your Live Storefront Setup">
          <s-stack gap="base">
            <s-paragraph>
              To confirm that your onboarding setup is fully functional:
            </s-paragraph>
            <s-ordered-list>
              <s-list-item>
                Configure at least one rule combo on the{" "}
                <s-link href="/app">Home page</s-link> (e.g., Buy Product A restricts
                Product B) and click <strong>Save All Rules</strong>.
              </s-list-item>
              <s-list-item>
                Visit your storefront and add <strong>Product A</strong> to your cart.
              </s-list-item>
              <s-list-item>
                Navigate to <strong>Product B</strong> and click &quot;Add to cart&quot;.
              </s-list-item>
              <s-list-item>
                Verify that the <strong>Cart Restriction Notice</strong> modal pops up
                with the restriction message, preventing the invalid addition.
              </s-list-item>
            </s-ordered-list>
          </s-stack>
        </s-section>

        {/* FAQ & TROUBLESHOOTING */}
        <s-section heading="❓ Frequently Asked Questions">
          <s-stack gap="base">
            <div>
              <strong>Why do I have to click &apos;Save&apos; in the Theme Editor?</strong>
              <p style={{ margin: "4px 0 0", color: "#616161", fontSize: "14px" }}>
                For merchant security and control, Shopify requires merchants to
                manually confirm and save theme customizations. Deep links open the
                exact embed drawer, but you must click Save to publish changes.
              </p>
            </div>

            <div>
              <strong>Can I test on an unpublished or draft theme?</strong>
              <p style={{ margin: "4px 0 0", color: "#616161", fontSize: "14px" }}>
                Yes! Use the Theme Selector in Step 1 to choose any draft theme. You
                can preview and test all restriction features in draft mode without
                affecting your live store.
              </p>
            </div>

            <div>
              <strong>Does this app touch or modify my theme&apos;s liquid code?</strong>
              <p style={{ margin: "4px 0 0", color: "#616161", fontSize: "14px" }}>
                No. As a certified Shopify Theme App Extension, all code is injected
                dynamically through the App Embed sandbox. If you ever uninstall the app,
                no leftover code or snippets remain.
              </p>
            </div>

            <div>
              <strong>Need technical assistance?</strong>
              <p style={{ margin: "4px 0 0", color: "#616161", fontSize: "14px" }}>
                Our engineering team is here to assist. Email us at{" "}
                <s-link href="mailto:tech@outside.tech">tech@outside.tech</s-link> for
                rapid troubleshooting.
              </p>
            </div>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
