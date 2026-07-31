/**
 * خادم صحتين الوسيط — Vercel Serverless Function (مربوط بـ Google Gemini المجاني)
 * ------------------------------------------------------------------------------
 * الملف يجب أن يكون في مسار:  api/chat.js
 * فيصبح رابط الخادم:          https://your-project.vercel.app/api/chat
 *
 * وظيفته: يستقبل رسائل المحادثة من الموقع، يضيف مفتاح Gemini السري
 * (المحفوظ في إعدادات Vercel لا في الكود)، ويمرّرها لـ Google، ثم يعيد الرد.
 * المفتاح لا يظهر أبدًا للمستخدم.
 */

const MODEL = "gemini-2.0-flash";   // نموذج مجاني سريع
const MAX_TOKENS = 1024;

export default async function handler(req, res) {
  // ترويسات CORS للسماح للموقع بالاتصال
  const origin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "استخدم POST" }); return; }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "المفتاح غير مضبوط في إعدادات الخادم (GEMINI_API_KEY)" });
    return;
  }

  // قراءة جسم الطلب (Vercel يوفّره جاهزًا في req.body غالبًا)
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  if (!body || typeof body !== "object") body = {};

  const system = typeof body.system === "string" ? body.system : "أنت مساعد مفيد. أجب بالعربية باختصار.";
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const trimmed = messages.slice(-20).map(function (m) {
    return {
      role: m.role === "assistant" ? "model" : "user",   // Gemini يستخدم "model"
      parts: [{ text: String(m.content || "").slice(0, 4000) }],
    };
  });

  if (!trimmed.length) { res.status(400).json({ error: "لا توجد رسائل" }); return; }

  const geminiBody = {
    systemInstruction: { parts: [{ text: system }] },
    contents: trimmed,
    generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 },
  };

  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL + ":generateContent?key=" + process.env.GEMINI_API_KEY;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!r.ok) {
      const errText = await r.text();
      res.status(r.status).json({ error: "خطأ من Gemini", detail: errText.slice(0, 200) });
      return;
    }

    const data = await r.json();
    let reply = "لم أستطع توليد رد.";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const t = data.candidates[0].content.parts.map(function (p) { return p.text; }).join("\n").trim();
      if (t) reply = t;
    }

    res.status(200).json({ reply: reply });
  } catch (err) {
    res.status(502).json({ error: "تعذّر الاتصال بـ Gemini" });
  }
}
