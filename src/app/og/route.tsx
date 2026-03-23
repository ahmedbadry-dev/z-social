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
            "radial-gradient(700px circle at 85% 15%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(600px circle at 15% 85%, rgba(34,197,94,0.25), transparent 60%), linear-gradient(135deg, #0b1120 0%, #0f172a 55%, #111827 100%)",
          color: "#e2e8f0",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #3b82f6, #22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#07131f",
              fontWeight: 800,
              fontSize: "28px",
              letterSpacing: "-1px",
              boxShadow: "0 12px 28px rgba(59,130,246,0.35)",
            }}
          >
            Z
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "16px", opacity: 0.7, letterSpacing: "0.6px" }}>
              {eyebrow}
            </span>
            <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px" }}>
              Z-Social
            </span>
          </div>
          <span
            style={{
              marginLeft: "auto",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              fontSize: "13px",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: "#c7d2fe",
            }}
          >
            {badge}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            padding: "36px 40px",
            borderRadius: "24px",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            boxShadow: "0 24px 60px rgba(2, 6, 23, 0.45)",
          }}
        >
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
              lineHeight: 1.45,
              margin: 0,
              maxWidth: "900px",
              color: "rgba(226, 232, 240, 0.82)",
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
