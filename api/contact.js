/**
 * Serverless Endpoint Blindado: /api/contact
 * Compatível com Vercel Functions / Node.js Serverless
 *
 * Controles AppSec implementados:
 * 1. Restrição estrita ao método POST (405 Method Not Allowed)
 * 2. Validação de Origin / CSRF (ALLOWED_ORIGIN)
 * 3. Rate Limiting por IP (Sliding Window contra flood de e-mails/mensagens)
 * 4. Honeypot + Time-Trap anti-bot
 * 5. Validação opcional de Cloudflare Turnstile no servidor via variável de ambiente
 * 6. Sanitização e Escape HTML contra XSS / Header Injection
 * 7. Uso exclusivo de variáveis de ambiente (process.env) para segredos
 */

const rateLimitStore = new Map();
const WINDOW_MS = 10 * 60 * 1000; // Janela de 10 minutos
const MAX_REQUESTS_PER_WINDOW = 3; // Máximo 3 envios a cada 10 min por IP

const ALLOWED_SUBJECTS = new Set([
  'Dúvida sobre Agendamento',
  'Clube de Assinatura Mensal',
  'Elogio ou Sugestão',
  'Outro Assunto'
]);

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ip) || [];
  const validTimestamps = timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitStore.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitStore.set(ip, validTimestamps);
  return false;
}

export default async function handler(req, res) {
  // Cabeçalhos de segurança da API (Prevenção de cache e sniffing)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // 1. Apenas POST é permitido
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // 2. Verificação de Origin (Mitigação CSRF)
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const requestOrigin = req.headers.origin;
  if (allowedOrigin && requestOrigin && requestOrigin !== allowedOrigin) {
    return res.status(403).json({ error: 'Origem não autorizada.' });
  }

  // 3. Rate Limiting por IP
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.setHeader('Retry-After', '600');
    return res.status(429).json({
      error: 'Limite de envios atingido. Tente novamente em alguns minutos.'
    });
  }

  const body = req.body || {};

  // 4. Honeypot & Time-Trap (Defesa silenciosa contra bots)
  if (body.website_url && String(body.website_url).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const loadedAt = Number(body.form_loaded_at || 0);
  if (!loadedAt || Date.now() - loadedAt < 2000) {
    return res.status(400).json({ error: 'Submissão inválida.' });
  }

  // 5. Sanitização e Validação Estrita dos Campos
  const name = escapeHtml(String(body.name || '')).slice(0, 80);
  const phone = escapeHtml(String(body.phone || '')).slice(0, 20);
  const rawSubject = String(body.subject || '');
  const subject = ALLOWED_SUBJECTS.has(rawSubject) ? rawSubject : 'Dúvida sobre Agendamento';
  const message = escapeHtml(String(body.message || '')).slice(0, 500);

  if (name.length < 2 || !/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(name)) {
    return res.status(400).json({ error: 'Nome inválido.' });
  }

  if (!/^[0-9+()\s-]{8,20}$/.test(phone)) {
    return res.status(400).json({ error: 'Telefone inválido.' });
  }

  if (message.length < 5) {
    return res.status(400).json({ error: 'Mensagem muito curta.' });
  }

  // 6. Validação Cloudflare Turnstile (se configurado nas variáveis de ambiente)
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const token = String(body['cf-turnstile-response'] || '');
    if (!token) {
      return res.status(400).json({ error: 'Verificação anti-bot pendente.' });
    }

    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: token,
          remoteip: clientIp
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return res.status(403).json({ error: 'Falha na validação anti-bot.' });
      }
    } catch {
      return res.status(502).json({ error: 'Erro ao validar desafio de segurança.' });
    }
  }

  // 7. Envio seguro usando Segredos em Variáveis de Ambiente (Sem expor no Front-end)
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'Joel Barber Site',
          name,
          phone,
          subject,
          message,
          timestamp: new Date().toISOString()
        })
      });
    } catch {
      // Não vaza detalhes internos do servidor ou da URL do webhook
      return res.status(500).json({ error: 'Erro interno ao processar mensagem.' });
    }
  }

  return res.status(200).json({ ok: true, message: 'Mensagem recebida com segurança.' });
}
