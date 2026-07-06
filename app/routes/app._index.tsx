import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, Form, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query GetAppConfiguration {
      currentAppInstallation {
        id
        metafield(namespace: "cart_restriction_app", key: "configuration") {
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
  );

  const resJson = await response.json();
  const jsonString = resJson.data?.currentAppInstallation?.metafield?.value;
  const productsList = resJson.data?.products?.nodes || [];
  // const appId =
  //   resJson.data?.currentAppInstallation?.id?.split("/").pop() || "";

  let savedMappings = [{ id: "1", buyProductId: "", restrictedProductIds: [] }];
  if (jsonString) {
    try {
      const config = JSON.parse(jsonString);
      if (
        config.ruleType === "product_mapping" &&
        Array.isArray(config.mappings)
      ) {
        savedMappings = config.mappings;
      }
    } catch (e) {
      console.error("JSON parsing error:", e);
    }
  }

  const shopName = session.shop.replace(".myshopify.com", "");
  const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/150132949129/editor?context=apps&appEmbed=81dc38a6886e9463901268bdde6d9825%2Fapp_embed`;

  return { savedMappings, products: productsList, embedUrl };
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

  // ❌ Helper to remove a single item from the restriction tags array
  const removeRestrictionTag = (
    rowId: string,
    currentSelections: string[],
    idToRemove: string,
  ) => {
    const filtered = currentSelections.filter((id) => id !== idToRemove);
    updateRow(rowId, "restrictedProductIds", filtered);
  };

  return (
    <div
      style={{
        padding: "40px 24px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#202223",
        backgroundColor: "#f6f6f7",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "700px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0px 4px 12px rgba(0, 0, 0, 0.05), 0px 1px 3px rgba(0, 0, 0, 0.05)",
            padding: "32px",
            border: "1px solid #e1e3e5",
          }}
        >
          {/* HEADER SECTION */}
          <div style={{ marginBottom: "28px" }}>
            <h2
              style={{
                margin: "0 0 6px 0",
                fontSize: "22px",
                fontWeight: "650",
                color: "#1a1c1d",
              }}
            >
              🔄 Multi-Product Restriction Manager
            </h2>
            <p style={{ color: "#6d7175", fontSize: "14px", margin: "0" }}>
              Configure up to 3 active restriction sets. Prevent conflicting
              products from co-existing in checkout baskets.
            </p>
          </div>

          {/* APP EMBED BANNER */}
          <div
            style={{
              backgroundColor: "#1a1c1d",
              color: "#ffffff",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <p
              style={{
                margin: "0",
                fontSize: "13.5px",
                lineHeight: "1.5",
                fontWeight: "400",
                color: "#e1e3e5",
              }}
            >
              To apply restriction rules, embed the Cart Restriction App theme
              in your shopify theme editor.
            </p>
            <div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  backgroundColor: "#ffffff",
                  color: "#1a1c1d",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "1px solid #ffffff",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                  textAlign: "center",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e1e3e5")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ffffff")
                }
                onFocus={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e1e3e5")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ffffff")
                }
              >
                Activate App Embed
              </a>
            </div>
          </div>

          {/* CONFIGURATION FORM */}
          <Form
            method="POST"
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {mappings.map((mapping, index) => (
              <div
                key={mapping.id}
                style={{
                  border: "1px solid #e1e3e5",
                  padding: "20px",
                  borderRadius: "8px",
                  backgroundColor: "#fafbfb",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4
                    style={{
                      margin: "0",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#202223",
                    }}
                  >
                    Ruleset Combo #{index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeRow(mapping.id)}
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      background: "none",
                      border: "none",
                      color: "#bf0711",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#fbeaebee")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                    onFocus={(e) =>
                      (e.currentTarget.style.backgroundColor = "#fbeaebee")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    Remove Rule
                  </button>
                </div>

                {/* BUY DROPDOWN */}
                <div>
                  <label
                    htmlFor={`buyProduct-${mapping.id}`}
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#434649",
                      marginBottom: "6px",
                    }}
                  >
                    Select Buy Product:
                  </label>
                  <select
                    id={`buyProduct-${mapping.id}`}
                    name="buyProductId"
                    value={mapping.buyProductId}
                    onChange={(e) =>
                      updateRow(mapping.id, "buyProductId", e.target.value)
                    }
                    style={{
                      padding: "8px 12px",
                      width: "100%",
                      borderRadius: "6px",
                      border: "1px solid #babfc3",
                      backgroundColor: "#ffffff",
                      fontSize: "14px",
                      color: "#202223",
                    }}
                    required
                  >
                    <option value="">--- Choose Core Product ---</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RESTRICTION CONFIGURATION BOX */}
                <div>
                  <label
                    htmlFor={`restricted-${mapping.id}`}
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#434649",
                      marginBottom: "6px",
                    }}
                  >
                    Select Mapped Restrictions (Max 3):
                  </label>

                  {/* 🌟 APPEAR ON TOP: ACTIVE SELECTION TAG MATRIX */}
                  {mapping.restrictedProductIds.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginBottom: "10px",
                        padding: "8px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e1e3e5",
                        borderRadius: "6px",
                      }}
                    >
                      {mapping.restrictedProductIds.map((id) => {
                        const matchedProduct = products.find(
                          (p) => p.id === id,
                        );
                        return (
                          <div
                            key={id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: "#f1f2f4",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              color: "#202223",
                              border: "1px solid #d2d5d9",
                            }}
                          >
                            <span>
                              {matchedProduct
                                ? matchedProduct.title
                                : "Selected Product"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removeRestrictionTag(
                                  mapping.id,
                                  mapping.restrictedProductIds,
                                  id,
                                )
                              }
                              style={{
                                border: "none",
                                background: "none",
                                color: "#6d7175",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                padding: "0 2px",
                                display: "flex",
                                alignItems: "center",
                              }}
                              aria-label={`Remove ${matchedProduct?.title || "product"}`}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* UNDERLYING BACKEND SELECT ELEMENT */}
                  <select
                    id={`restricted-${mapping.id}`}
                    name={`restrictedProductIds_${index}`}
                    multiple
                    value={mapping.restrictedProductIds}
                    onChange={(e) => {
                      const options = Array.from(
                        e.target.selectedOptions,
                        (opt) => opt.value,
                      );
                      if (options.length <= 3)
                        updateRow(mapping.id, "restrictedProductIds", options);
                    }}
                    style={{
                      padding: "8px 12px",
                      width: "100%",
                      height: "110px",
                      borderRadius: "6px",
                      border: "1px solid #babfc3",
                      backgroundColor: "#ffffff",
                      fontSize: "14px",
                      color: "#202223",
                    }}
                    required
                  >
                    {products
                      .filter((p) => p.id !== mapping.buyProductId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))}

            {/* ACTION TRAIL FOOTER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #e1e3e5",
              }}
            >
              <div>
                {mappings.length < 3 && (
                  <button
                    type="button"
                    onClick={addRow}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #babfc3",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#202223",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f6f6f7")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#ffffff")
                    }
                    onFocus={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f6f6f7")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.backgroundColor = "#ffffff")
                    }
                  >
                    ➕ Add New Rule Set
                  </button>
                )}
              </div>

              <button
                type="submit"
                style={{
                  padding: "9px 20px",
                  backgroundColor: "#008060",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s ease",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#006e52")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#008060")
                }
                onFocus={(e) =>
                  (e.currentTarget.style.backgroundColor = "#006e52")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.backgroundColor = "#008060")
                }
              >
                Save All Rules
              </button>
            </div>
          </Form>

          {/* SERVER MESSAGES */}
          {actionData?.success && (
            <div
              style={{
                color: "#008060",
                backgroundColor: "#f1fbf7",
                padding: "12px",
                borderRadius: "6px",
                marginTop: "20px",
                border: "1px solid #a3e0cc",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ✅ {actionData.message}
            </div>
          )}
          {actionData?.error && (
            <div
              style={{
                color: "#bf0711",
                backgroundColor: "#fbeaebee",
                padding: "12px",
                borderRadius: "6px",
                marginTop: "20px",
                border: "1px solid #f9cacc",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ❌ {actionData.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
