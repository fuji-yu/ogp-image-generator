import { Hono } from "hono";
import { validator } from "hono/validator";
import { etag } from "hono/etag";
import { cache } from "hono/cache";
import { ImageResponse } from "hono-og";

type Bindings = {
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get(
  "/ogp",
  etag(),
  cache({ cacheName: "ogp", cacheControl: "max-age=604800" }),
  validator("query", (value, c) => {
    const { title, date } = value;
    if (!title || !date) {
      return c.text("クエリパラメータが異常です", 400);
    }
  }),
  async (c) => {
    const { title, date } = await c.req.query();

    // フォントの読み込み
    let fontArrBuf: null | ArrayBuffer = null;
    if (fontArrBuf === null) {
      const url = new URL(c.req.url);
      const fontObj = await c.env.ASSETS.fetch(url.origin + "/" + "NotoSansJP-Bold.ttf");
      if (!fontObj) {
        return c.text("フォントが見つかりません", 404);
      }
      fontArrBuf = await fontObj.arrayBuffer();
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "32px",
            background: `linear-gradient(45deg, rgba(25,152,97,1) 0%, rgba(0,93,255,1) 100%)`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              background: "white",
              borderRadius: "32px",
              padding: "32px",
            }}
          >
            <span />
            <span
              style={{
                fontSize: "64px",
                color: "filter: invert(100%) grayscale(100%) contrast(100)",
              }}
            >
              {title || "Husete"}
            </span>
            <span
              style={{
                width: "100%",
                fontSize: "48px",
                display: "flex",
                justifyContent: "flex-end",
                color: "black",
              }}
            >
              <span>{date}</span>
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "NotoSansJP",
            data: fontArrBuf,
            weight: 100,
            style: "normal",
          },
        ],
      }
    );
  }
);

export default app;
