import { ImageResponse } from "next/og";

// Favicon gerado em código: o Next.js serve isto automaticamente em /icon
// (e nos tamanhos que os navegadores pedirem). Moeda com "$" — remete direto
// a dinheiro/investimento, mais do que o grafico de barras da versao anterior.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1317",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #4fe3dc 0%, #0fa8a4 100%)",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0f1317",
              lineHeight: 1,
            }}
          >
            $
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
