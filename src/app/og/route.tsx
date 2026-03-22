import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const titleParam = searchParams.get("title")
  const descriptionParam = searchParams.get("description")
  const eyebrowParam = searchParams.get("eyebrow")
  const typeParam = searchParams.get("type")

  const title = (titleParam ?? "Z-Social").slice(0, 80)
  const description =
    (descriptionParam ??
      "A modern social platform to share posts, connect with friends, and stay updated.")
      .slice(0, 160)
  const eyebrow = (eyebrowParam ?? "Z-Social").slice(0, 32)
  const badge = typeParam === "post" ? "Post" : "Social"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "radial-gradient(900px circle at 85% 15%, rgba(56,189,248,0.25), transparent 45%), linear-gradient(135deg, #0f172a 0%, #0b3b2e 100%)",
          color: "#e2e8f0",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#04130c",
              fontWeight: 800,
              fontSize: "28px",
              letterSpacing: "-1px",
              boxShadow: "0 10px 30px rgba(14,165,233,0.35)",
            }}
          >
            Z
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "18px", opacity: 0.8 }}>{eyebrow}</span>
            <span style={{ fontSize: "22px", fontWeight: 700 }}>Z-Social</span>
          </div>
          <span
            style={{
              marginLeft: "auto",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              fontSize: "14px",
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: "#cbd5f5",
            }}
          >
            {badge}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <h1
            style={{
              fontSize: "56px",
              lineHeight: 1.05,
              letterSpacing: "-1px",
              margin: 0,
              fontWeight: 800,
              color: "#f8fafc",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "24px",
              lineHeight: 1.4,
              margin: 0,
              maxWidth: "900px",
              color: "rgba(226, 232, 240, 0.85)",
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "18px",
            color: "rgba(226, 232, 240, 0.7)",
          }}
        >
          <span>z-social-rouge.vercel.app</span>
          <span>Connect with people</span>
        </div>
      </div>
    ),
    size
  )
}
