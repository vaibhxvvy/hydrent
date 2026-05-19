import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HydRent Hyderabad rent intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8faf9",
          color: "#17201d",
          padding: 64,
          fontFamily: "Arial",
        }}
      >
        <div style={{ fontSize: 28, color: "#3f8f79", fontWeight: 700 }}>HydRent</div>
        <div>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: 0 }}>
            Real Hyderabad rent intelligence
          </div>
          <div style={{ marginTop: 24, fontSize: 28, color: "#5f6b66", maxWidth: 820 }}>
            Verified community data, trust scores, weighted medians, and transparent rental
            analytics.
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#3f8f79" }}>
          Closed rents weighted highest. Listings are not the truth.
        </div>
      </div>
    ),
    { ...size },
  );
}
