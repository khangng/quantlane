// netlify/functions/ingest.js
// Nhận data từ EA (POST JSON) và lưu vào Netlify Blobs theo alias.
// Bảo vệ bằng header X-Ingest-Key khớp biến môi trường INGEST_KEY.

import { getStore } from "@netlify/blobs";

const ALLOWED_ALIASES = ["ftmo_1", "ftmo_2", "e8_1"];
// Cho phép cả luồng giá riêng: "<alias>_px"
const ALLOWED_PRICE = ALLOWED_ALIASES.map((a) => a + "_px");

function aliasAllowed(alias) {
  return ALLOWED_ALIASES.includes(alias) || ALLOWED_PRICE.includes(alias);
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // xác thực khóa bí mật
  const key = req.headers.get("x-ingest-key") || "";
  if (!process.env.INGEST_KEY || key !== process.env.INGEST_KEY) {
    return json({ error: "unauthorized" }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // alias bắt buộc và nằm trong danh sách cho phép (gồm cả luồng _px)
  const alias = String(body.alias || "").toLowerCase();
  if (!aliasAllowed(alias)) {
    return json({ error: "bad_alias", got: alias }, 400);
  }

  // gắn thời điểm nhận để web tính độ trễ chính xác phía server
  body.server_recv = Math.floor(Date.now() / 1000);

  const store = getStore("riskdesk");
  await store.setJSON(alias, body);

  // ----- LƯU LỊCH SỬ EQUITY LÂU DÀI (chỉ cho luồng equity, không cho _px) -----
  // Server tự dựng chuỗi thời gian: mỗi điểm cách nhau >= HIST_INTERVAL giây,
  // giữ tối đa HIST_MAX điểm (đủ xem lại nhiều ngày). EA không cần thay đổi gì.
  if (!alias.endsWith("_px") && typeof body.equity === "number") {
    const HIST_INTERVAL = 600;   // 10 phút giữa 2 điểm
    const HIST_MAX = 5000;       // ~34 ngày ở mức 10 phút
    const histKey = alias + "_hist";
    try {
      let hist = (await store.get(histKey, { type: "json" })) || [];
      if (!Array.isArray(hist)) hist = [];
      const now = body.ts || Math.floor(Date.now() / 1000);
      const last = hist[hist.length - 1];
      if (!last || (now - last.t) >= HIST_INTERVAL) {
        hist.push({ t: now, eq: Number(body.equity.toFixed(2)) });
        if (hist.length > HIST_MAX) hist = hist.slice(hist.length - HIST_MAX);
        await store.setJSON(histKey, hist);
      }
    } catch (e) {
      // lịch sử lỗi không được làm hỏng luồng chính
    }
  }

  return json({ ok: true, alias });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
