// netlify/functions/data.js
// Trả data cho trình duyệt. GET /.netlify/functions/data            -> cả 3 tài khoản
//                          GET /.netlify/functions/data?acct=ftmo_1 -> 1 tài khoản
// Đọc từ Netlify Blobs. Mở CORS để dashboard ở domain khác cũng gọi được.

import { getStore } from "@netlify/blobs";

const ALIASES = ["ftmo_1", "ftmo_2", "e8_1"];
const PRICE_KEYS = ALIASES.map((a) => a + "_px");
const HIST_KEYS = ALIASES.map((a) => a + "_hist");
const ALL_KEYS = [...ALIASES, ...PRICE_KEYS, ...HIST_KEYS];

export default async (req) => {
  const url = new URL(req.url);
  const acct = (url.searchParams.get("acct") || "").toLowerCase();
  const store = getStore("riskdesk");

  try {
    if (acct) {
      if (!ALL_KEYS.includes(acct)) return json({ error: "bad_alias" }, 400);
      const d = await store.get(acct, { type: "json" });
      return json(d || null);
    }
    // trả tất cả: equity + giá
    const out = {};
    await Promise.all(
      ALL_KEYS.map(async (a) => {
        out[a] = (await store.get(a, { type: "json" })) || null;
      })
    );
    return json(out);
  } catch (e) {
    return json({ error: "read_failed", detail: String(e) }, 500);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "no-store, max-age=0",
    },
  });
}
