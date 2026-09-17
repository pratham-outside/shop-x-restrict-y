const sections = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-information", label: "How We Use Information" },
  { id: "customer-information", label: "Customer Information" },
  { id: "data-storage", label: "Data Storage and Retention" },
  { id: "privacy-requests", label: "Shopify Privacy Requests" },
  { id: "data-security", label: "Data Security" },
  { id: "third-party-services", label: "Third-Party Services" },
  { id: "international-transfers", label: "International Data Transfers" },
  { id: "privacy-rights", label: "Your Privacy Rights" },
  { id: "changes", label: "Changes to This Privacy Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f6f7",
        color: "#202223",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e1e3e5",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              CartControl
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#6d7175",
                marginTop: "3px",
              }}
            >
              Privacy Policy
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "56px 24px 80px",
        }}
      >
        {/* Hero */}
        <section
          style={{
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: "999px",
              background: "#e3f1df",
              color: "#1f5c35",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            Privacy Policy
          </div>

          <h1
            style={{
              fontSize: "42px",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              margin: "0 0 14px",
              fontWeight: 700,
            }}
          >
            Your privacy matters to us
          </h1>

          <p
            style={{
              maxWidth: "720px",
              margin: 0,
              color: "#6d7175",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            This Privacy Policy explains how CartControl collects, uses, stores,
            and protects information when you install or use our app.
          </p>

          <div
            style={{
              marginTop: "20px",
              fontSize: "13px",
              color: "#6d7175",
            }}
          >
            Last updated: September 17, 2026
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px minmax(0, 1fr)",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* Sidebar */}
          <aside
            style={{
              position: "sticky",
              top: "24px",
              background: "#ffffff",
              border: "1px solid #e1e3e5",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6d7175",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
              }}
            >
              Contents
            </div>

            <nav>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{
                    display: "block",
                    padding: "7px 0",
                    color: "#42474c",
                    textDecoration: "none",
                    fontSize: "13px",
                    lineHeight: 1.4,
                  }}
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Policy Content */}
          <article
            style={{
              background: "#ffffff",
              border: "1px solid #e1e3e5",
              borderRadius: "12px",
              padding: "44px 48px",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.8,
                color: "#42474c",
                marginTop: 0,
              }}
            >
              CartControl helps Shopify merchants create product purchasing
              rules, including Buy X, Restrict Y rules. This Privacy Policy
              explains how we collect, use, store, and protect information when
              you install or use our app.
            </p>

            <Section
              id="information-we-collect"
              number="1"
              title="Information We Collect"
            >
              <p>
                We collect and process information that is necessary to provide
                the app&#39; functionality.
              </p>

              <h3>Information from Shopify</h3>

              <p>
                When you install the app, we may receive information from
                Shopify necessary to authenticate your store and provide the
                app&#39; features. This may include:
              </p>

              <ul>
                <li>Shop domain and shop identifier</li>
                <li>Shopify access and authentication information</li>
                <li>Product identifiers and product information</li>
                <li>App configuration and product restriction settings</li>
              </ul>

              <p>
                We only request and use Shopify API permissions that are
                necessary for the app to provide its functionality.
              </p>

              <h3>Information Provided by Merchants</h3>

              <p>
                When you use CartControl, you may provide product selections and
                purchasing rules. This information is used to configure the
                restrictions applied by the app.
              </p>
            </Section>

            <Section
              id="how-we-use-information"
              number="2"
              title="How We Use Information"
            >
              <p>We use collected information to:</p>

              <ul>
                <li>
                  Authenticate and connect your Shopify store with the app.
                </li>
                <li>
                  Provide and maintain the app&#39; product restriction
                  features.
                </li>
                <li>
                  Store and apply purchasing rules configured by merchants.
                </li>
                <li>Respond to support requests and technical issues.</li>
                <li>Maintain the security and reliability of the app.</li>
                <li>Comply with applicable legal and Shopify requirements.</li>
              </ul>

              <p>
                We do not use Shopify merchant or customer information for
                purposes unrelated to providing and maintaining the app&#39;
                functionality.
              </p>
            </Section>

            <Section
              id="customer-information"
              number="3"
              title="Customer Information"
            >
              <p>
                CartControl is primarily designed to manage product purchasing
                restrictions. We do not require customer personal information
                for the core functionality of creating and applying product
                restriction rules.
              </p>

              <p>
                If Shopify sends us personal information through a privacy or
                compliance request, we process that information only as
                necessary to respond to the request and comply with applicable
                requirements.
              </p>
            </Section>

            <Section
              id="data-storage"
              number="4"
              title="Data Storage and Retention"
            >
              <p>
                We retain information only for as long as necessary to provide
                the app&#39; functionality, maintain merchant configuration,
                comply with legal obligations, resolve disputes, and maintain
                security.
              </p>

              <p>
                When a merchant uninstalls the app, we take appropriate steps to
                remove or anonymize information that we are no longer required
                to retain.
              </p>
            </Section>

            <Section
              id="privacy-requests"
              number="5"
              title="Shopify Privacy Requests"
            >
              <p>
                We support Shopify&#39; mandatory privacy and compliance
                requirements. These include requests relating to customer data
                and requests to delete shop or customer information.
              </p>

              <p>
                When we receive a valid request through Shopify&#39; privacy
                compliance mechanisms, we process the request according to
                applicable requirements and our data retention obligations.
              </p>
            </Section>

            <Section id="data-security" number="6" title="Data Security">
              <p>
                We use reasonable technical and organizational measures to
                protect information against unauthorized access, disclosure,
                alteration, or destruction.
              </p>

              <p>
                Data transmitted between your browser, Shopify, and our services
                is protected using HTTPS/TLS where applicable.
              </p>
            </Section>

            <Section
              id="third-party-services"
              number="7"
              title="Third-Party Services"
            >
              <p>
                We may use third-party infrastructure and service providers to
                host, operate, monitor, and maintain the app. These providers
                may process information only as necessary to provide services to
                us and operate the app.
              </p>

              <p>
                We do not sell Shopify merchant or customer personal information
                to third parties.
              </p>
            </Section>

            <Section
              id="international-transfers"
              number="8"
              title="International Data Transfers"
            >
              <p>
                Depending on the infrastructure and service providers used to
                operate the app, information may be processed or stored in
                countries other than the country where the merchant or customer
                is located.
              </p>

              <p>
                Where required, we take appropriate measures for international
                data transfers in accordance with applicable privacy laws.
              </p>
            </Section>

            <Section id="privacy-rights" number="9" title="Your Privacy Rights">
              <p>
                Depending on applicable law, individuals may have rights
                relating to their personal information, including rights to
                access, correct, delete, or restrict certain processing of their
                information.
              </p>

              <p>
                Requests relating to Shopify customer data may also be submitted
                through the applicable Shopify privacy processes.
              </p>
            </Section>

            <Section
              id="changes"
              number="10"
              title="Changes to This Privacy Policy"
            >
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes to the app, our data practices, or applicable legal
                requirements. The updated version will be published on this page
                with a revised last updated date.
              </p>
            </Section>

            {/* Contact */}
            <section
              id="contact"
              style={{
                marginTop: "48px",
                padding: "28px",
                borderRadius: "10px",
                background: "#f6f6f7",
                border: "1px solid #e1e3e5",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "#202223",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  @
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "21px",
                  }}
                >
                  11. Contact Us
                </h2>
              </div>

              <p
                style={{
                  marginBottom: "16px",
                  color: "#6d7175",
                }}
              >
                If you have questions about this Privacy Policy or how we handle
                information, please contact us.
              </p>

              <a
                href="mailto:tech@outside.tech"
                style={{
                  display: "inline-block",
                  color: "#202223",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                tech@outside.tech
              </a>
            </section>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e1e3e5",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "#6d7175",
          }}
        >
          © {new Date().getFullYear()} CartControl. All rights reserved.
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 800px) {
          main {
            padding-top: 36px !important;
          }

          main > div {
            grid-template-columns: 1fr !important;
          }

          aside {
            display: none !important;
          }

          article {
            padding: 28px 22px !important;
          }

          h1 {
            font-size: 34px !important;
          }
        }
      `}</style>
    </div>
  );
}

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        paddingTop: "40px",
        marginTop: "8px",
        borderTop: "1px solid #e1e3e5",
      }}
    >
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "0 0 18px",
          fontSize: "23px",
          lineHeight: 1.3,
          letterSpacing: "-0.2px",
        }}
      >
        <span
          style={{
            color: "#6d7175",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {number}.
        </span>

        {title}
      </h2>

      <div
        style={{
          color: "#42474c",
          fontSize: "15px",
          lineHeight: 1.75,
        }}
      >
        {children}
      </div>

      <style>{`
        #${id} h3 {
          margin: 26px 0 8px;
          font-size: 16px;
          color: #202223;
        }

        #${id} p {
          margin: 0 0 16px;
        }

        #${id} ul {
          margin: 0 0 20px;
          padding-left: 22px;
        }

        #${id} li {
          margin-bottom: 7px;
          padding-left: 4px;
        }
      `}</style>
    </section>
  );
}
