const FEEDBACK_TO = "jerrychuang1017@gmail.com";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "Feedback email is not configured" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const message = String(body.message || "").trim();
  const name = String(body.name || "Anonymous").trim();
  const page = String(body.page || "Unknown").trim();
  const email = String(body.email || "").trim();
  const userAgent = String(body.userAgent || "").trim();

  if (!message) {
    return res.status(400).json({ error: "Feedback is required" });
  }

  const text = [
    `Name: ${name}`,
    email ? `Email: ${email}` : null,
    `Page: ${page}`,
    userAgent ? `User agent: ${userAgent}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Project Dream Day <onboarding@resend.dev>",
      to: FEEDBACK_TO,
      subject: "Project Dream Day feedback",
      text,
    }),
  });

  if (!response.ok) {
    return res.status(502).json({ error: "Unable to send feedback" });
  }

  return res.status(200).json({ ok: true });
}
