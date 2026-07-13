export default function AdditionalPage() {
  return (
    <s-page heading="Implementation & Merchant User Guide">
      <s-stack gap="base">
        <s-paragraph>
          Follow this reference sequence to verify the validation behaviors are
          operating successfully within your store&apos;s live environment.
        </s-paragraph>

        <s-section heading="🛠️ Setting Up Rules">
          <s-ordered-list>
            <s-list-item>
              Open the <strong>Product Mapping Setup</strong> tab inside this
              application portal window view.
            </s-list-item>
            <s-list-item>
              Pick a core item inside the baseline dropdown field array list to
              specify your anchor <strong>Buy Product</strong>.
            </s-list-item>
            <s-list-item>
              Select <strong>up to 3 complementary products</strong> to restrict.
            </s-list-item>
            <s-list-item>
              Click the green action submit button to compile and flash your
              restrictions down into the live Shopify database.
            </s-list-item>
          </s-ordered-list>
        </s-section>

        <s-section heading="⚙️ Storefront Activation Protocols">
          <s-unordered-list>
            <s-list-item>
              Navigate into your core store system controls dashboard menu panel
              located at <strong>Shopify Settings ➡️ Checkout</strong>.
            </s-list-item>
            <s-list-item>
              Scroll directly down until you encounter the specific system submenu
              area titled <strong>Checkout rules / Validation rules</strong>.
            </s-list-item>
            <s-list-item>
              Find our application container instance row entity listing, click to
              toggle its status state from disabled to{" "}
              <strong>Active / Enabled</strong>, and press the page header Save
              button.
            </s-list-item>
          </s-unordered-list>
        </s-section>

        <s-section heading="✉️ Need Assistance? Technical Support Desk">
          <s-paragraph>
            Are you encountering mapping sync issues or need help tailoring your
            purchase validation workflows? Reach out to our dedicated support tier
            directly:
          </s-paragraph>
          <s-box paddingBlockStart="base" paddingBlockEnd="base">
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-badge tone="success">Email Support</s-badge>
              <s-link href="mailto:support@cartrestrictionapp.com">
                support@cartrestrictionapp.com
              </s-link>
            </s-stack>
          </s-box>
          <s-paragraph>
            <em>*Triage response commitments: Our engineering team monitors incoming
            request streams 24/7/366 with typical turnarounds settling under 12
            hours.</em>
          </s-paragraph>
        </s-section>
      </s-stack>
    </s-page>
  );
}
