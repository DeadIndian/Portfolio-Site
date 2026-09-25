import { ImageResponse } from "next/og";

export const alt = "Golla Bharath / Dead Indian. Same human. Different shell.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#edf0f2",
        color: "#19232c",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 21,
          letterSpacing: 0,
          color: "#526171",
        }}
      >
        Software, infrastructure, and open source.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 108,
          fontWeight: 700,
          marginTop: 54,
        }}
      >
        Golla Bharath<span style={{ color: "#314fc4" }}>/</span>
      </div>
      <div style={{ display: "flex", fontSize: 38, marginTop: 20 }}>
        Same human. Different shell.
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "auto",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 23 }}>gollabharath.me</span>
        <span
          style={{
            fontSize: 26,
            background: "#d4dfc9",
            color: "#233c36",
            padding: "18px 28px",
          }}
        >
          also known as Dead Indian
        </span>
      </div>
    </div>,
    size,
  );
}
