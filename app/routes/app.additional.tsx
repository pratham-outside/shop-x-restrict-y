export default function AdditionalPage() {
  return (
    <div style={{ maxWidth: "750px", lineHeight: "1.6" }}>
      <h2>📖 Implementation & Merchant User Guide</h2>
      <p style={{ color: "#555" }}>
        Follow this reference sequence to verify the validation behaviors are
        operating successfully within your store&apos;s live environment.
      </p>
      <hr
        style={{
          border: "0",
          borderTop: "1px solid #e1e1e1",
          margin: "20px 0",
        }}
      />

      <h3>🛠️ Setting Up Rules</h3>
      <ol style={{ paddingLeft: "20px", marginBottom: "24px" }}>
        <li style={{ marginBottom: "8px" }}>
          Open the <strong>Product Mapping Setup</strong> tab inside this
          application portal window view.
        </li>
        <li style={{ marginBottom: "8px" }}>
          Pick a core item inside the baseline dropdown field array list to
          specify your anchor <strong>Buy Product</strong>.
        </li>
        <li style={{ marginBottom: "8px" }}>
          Hold down your interface keyboard modifier key (<code>Ctrl</code> on
          Windows / <code>Cmd</code> on Mac) inside the lower box frame to
          highlight <strong>up to 3 complementary products</strong> to restrict.
        </li>
        <li style={{ marginBottom: "8px" }}>
          Click the green action submit button to compile and flash your
          restrictions down into the live Shopify database memory nodes.
        </li>
      </ol>

      <h3>⚙️ Storefront Activation Protocols</h3>
      <ul style={{ paddingLeft: "20px", marginBottom: "32px" }}>
        <li style={{ marginBottom: "8px" }}>
          Navigate into your core store system controls dashboard menu panel
          located at <strong>Shopify Settings ➡️ Checkout</strong>.
        </li>
        <li style={{ marginBottom: "8px" }}>
          Scroll directly down until you encounter the specific system submenu
          area titled <strong>Checkout rules / Validation rules</strong>.
        </li>
        <li style={{ marginBottom: "8px" }}>
          Find our application container instance row entity listing, click to
          toggle its status state from disabled to{" "}
          <strong>Active / Enabled</strong>, and press the page header Save
          button.
        </li>
      </ul>

      {/* ✉️ SUPPORT CORNER LAYOUT MATRIX */}
      <div
        style={{
          backgroundColor: "#f6f6f7",
          border: "1px solid #e3e3e5",
          padding: "24px",
          borderRadius: "8px",
          marginTop: "16px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#1a1a1a" }}>
          ✉️ Need Assistance? Technical Support Desk
        </h3>
        <p style={{ margin: "0 0 16px 0", color: "#4a4a4a" }}>
          Are you encountering mapping sync issues or need help tailoring your
          purchase validation workflows? Reach out to our dedicated support tier
          directly:
        </p>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#fff",
            padding: "12px 24px",
            borderRadius: "4px",
            border: "1px solid #dcdcdc",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#008060",
          }}
        >
          📧 support@cartrestrictionapp.com
        </div>
        <p
          style={{
            margin: "12px 0 0 0",
            fontSize: "12px",
            color: "#6d6d6d",
            fontStyle: "italic",
          }}
        >
          *Triage response commitments: Our engineering team monitors incoming
          request streams 24/7/366 with typical turnarounds settling under 12
          hours.
        </p>
      </div>
    </div>
  );
}
