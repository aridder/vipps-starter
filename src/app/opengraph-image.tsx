import { ImageResponse } from "next/og";
import { resolveSite } from "@/lib/site";

// Generated rather than shipped as a PNG: the card has to follow APP_NAME and
// the tagline, which are runtime env config, so a checked-in image would go
// stale the moment someone rebrands the starter.

export const alt = "Vipps Starter — a complete Vipps MobilePay integration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const site = resolveSite();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0c0a09",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "999px",
              backgroundColor: "#34d399",
            }}
          />
          <div
            style={{
              color: "#d6d3d1",
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            Vipps · Next.js · TypeScript · tRPC · Prisma
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "white",
              fontSize: "82px",
              fontWeight: 900,
              lineHeight: 1.03,
              letterSpacing: "-0.04em",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              marginTop: "24px",
              color: "#a8a29e",
              fontSize: "32px",
              lineHeight: 1.35,
              maxWidth: "900px",
            }}
          >
            Betaling, abonnement, QR, Vipps Login og signerte webhooks — ferdig
            bygget, klar til å klone.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "#ff7a4d", fontSize: "28px", fontWeight: 800 }}>
            {site.githubUrl.replace(/^https:\/\//, "")}
          </div>
          <div style={{ color: "#57534e", fontSize: "24px" }}>
            PolyForm Small Business
          </div>
        </div>
      </div>
    ),
    size,
  );
}
