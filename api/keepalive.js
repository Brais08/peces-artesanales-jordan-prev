// Latido diario (Vercel Cron, ver vercel.json): hace una consulta real a la base de datos
// para que Supabase no pause el proyecto gratuito por inactividad.
// Solo lee con la clave pública; no puede modificar nada.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://japugfszhiamhevfbacl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_DlmFJHzTpZxCVJ4zlHnX5A_pSuQbyiV';

module.exports = async (req, res) => {
  // Si se define CRON_SECRET en Vercel, solo el propio Vercel Cron puede llamarlo
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.statusCode = 401;
    return res.end('No autorizado');
  }
  res.setHeader('Cache-Control', 'no-store');
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, { headers: { apikey: SUPABASE_KEY } });
    res.statusCode = r.ok ? 200 : 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: r.ok, status: r.status }));
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false }));
  }
};
