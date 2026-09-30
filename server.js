/**
 * IPTV Pro Brasil - Servidor de Streaming, Telemetria e Proxy HLS
 * 
 * Recursos:
 * - Servidor estático de alta performance
 * - Telemetria em tempo real: /api/telemetry (grava em error_reports.log)
 * - Proxy de Streaming M3U8 inteligente com reescrita de URLs relativas e CORS irrestrito
 * - APIs REST: /api/channels, /api/categories, /api/health
 * - Servidor de Playlist: /playlist.m3u
 * - Zero dependências externas
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const CHANNELS_FILE = path.join(__dirname, 'canais_completos.json');
const M3U_FILE = path.join(__dirname, 'canais_completos.m3u');
const ERROR_LOG_FILE = path.join(__dirname, 'error_reports.log');

// Carrega os canais em memória
let channelsData = [];
try {
  if (fs.existsSync(CHANNELS_FILE)) {
    channelsData = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
    console.log(`[IPTV Server] ✅ Base de dados carregada: ${channelsData.length} canais.`);
  }
} catch (err) {
  console.error('[IPTV Server] ❌ Erro ao ler canais_completos.json:', err.message);
}

// MIME Types mapeados
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.m3u': 'application/x-mpegurl; charset=utf-8',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.key': 'application/octet-stream',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Range'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper: Registra telemetria de erro
function logTelemetryError(report) {
  // Ignora ruído de script error anônimo mascarado por extensões ou CORS externo
  if (report.type === 'WINDOW_JS_ERROR' && report.details && report.details.message === 'Script error.') {
    return;
  }

  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] 🚨 ERRO REPORTADO PELO NAVEGADOR:
Tipo: ${report.type || 'DESCONHECIDO'}
Canal: ${report.channel || 'Nenhum'}
URL do Stream: ${report.streamUrl || report.url || 'N/A'}
Detalhes: ${JSON.stringify(report.details || report.error || {}, null, 2)}
User-Agent: ${report.userAgent || 'N/A'}
--------------------------------------------------------------------------------\n`;

  console.error(`\n[TELEMETRIA DO CLIENTE] ${report.type || 'ERRO'} em canal "${report.channel || 'N/A'}":`);
  console.error(`  Stream: ${report.streamUrl || report.url || 'N/A'}`);
  if (report.details) console.error(`  Detalhes:`, report.details);

  try {
    fs.appendFileSync(ERROR_LOG_FILE, entry, 'utf8');
  } catch (e) {
    console.error('[IPTV Server] Erro ao gravar error_reports.log:', e.message);
  }
}

// Agentes HTTP/HTTPS com Keep-Alive de alta performance para reuso de sockets TCP/TLS sem latência de handshake
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 300,
  maxFreeSockets: 60,
  timeout: 30000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 300,
  maxFreeSockets: 60,
  timeout: 30000,
  rejectUnauthorized: false
});

// Helper: Busca com redirecionamentos recursivos, keep-alive persistente e abort rápido
function fetchWithRedirects(targetUrl, headers = {}, maxHops = 5, clientReq = null) {
  return new Promise((resolve, reject) => {
    if (maxHops < 0) return reject(new Error('Limite de redirecionamentos excedido'));
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;
      const agent = isHttps ? httpsAgent : httpAgent;

      const reqHeaders = Object.assign({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }, headers);

      const upstreamReq = client.get(targetUrl, {
        headers: reqHeaders,
        agent: agent,
        timeout: 15000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirect = res.headers.location;
          if (!redirect.startsWith('http')) {
            redirect = new URL(redirect, targetUrl).toString();
          }
          res.resume(); // Drena stream para reutilizar socket
          return resolve(fetchWithRedirects(redirect, headers, maxHops - 1, clientReq));
        }
        resolve({ res, finalUrl: targetUrl, upstreamReq });
      });

      upstreamReq.setNoDelay(true); // Desativa algoritmo de Nagle para despacho imediato de pacotes

      upstreamReq.on('error', reject);
      upstreamReq.on('timeout', () => {
        upstreamReq.destroy();
        reject(new Error('Timeout de conexão ao stream'));
      });

      // Se o cliente (navegador) cancelar a requisição ou trocar de canal, aborta imediatamente o upstream
      if (clientReq) {
        clientReq.once('close', () => {
          if (!upstreamReq.destroyed) upstreamReq.destroy();
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

// Helper: Reescrita inteligente de playlist M3U8
function rewriteM3U8(content, baseUrl, proxyPrefix) {
  const lines = content.split(/\r?\n/);
  const out = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Reescreve tags com atributo URI="..." (ex: chaves AES-128 e legendas)
      let rewrittenTag = trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
        try {
          const abs = new URL(uri, baseUrl).toString();
          return 'URI="' + proxyPrefix + encodeURIComponent(abs) + '"';
        } catch (e) {
          return match;
        }
      });
      out.push(rewrittenTag);
    } else {
      // Linha de sub-playlist ou segmento .ts
      try {
        const abs = new URL(trimmed, baseUrl).toString();
        out.push(proxyPrefix + encodeURIComponent(abs));
      } catch (e) {
        out.push(trimmed);
      }
    }
  }

  return out.join('\n');
}

// Manipulador de Proxy Inteligente de Alta Velocidade (Direct Stream Pipeline)
async function handleStreamProxy(req, res, targetUrl) {
  if (!targetUrl) {
    return sendJSON(res, 400, { error: 'Parâmetro "url" é obrigatório.' });
  }

  let upstreamResponse = null;
  let activeUpstreamReq = null;

  // Se o navegador fechar ou trocar de canal, destrói a conexão upstream imediatamente para liberar 100% da banda
  req.once('close', () => {
    if (activeUpstreamReq && !activeUpstreamReq.destroyed) {
      try { activeUpstreamReq.destroy(); } catch (e) {}
    }
    if (upstreamResponse && !upstreamResponse.destroyed) {
      try { upstreamResponse.destroy(); } catch (e) {}
    }
  });

  try {
    const forwardHeaders = {};
    if (req.headers.range) forwardHeaders['Range'] = req.headers.range;

    const { res: upstreamRes, finalUrl, upstreamReq } = await fetchWithRedirects(targetUrl, forwardHeaders, 5, req);
    upstreamResponse = upstreamRes;
    activeUpstreamReq = upstreamReq;

    const contentType = (upstreamRes.headers['content-type'] || '').toLowerCase();
    const isM3U8 = contentType.includes('mpegurl') || targetUrl.includes('.m3u8') || finalUrl.includes('.m3u8');

    if (isM3U8) {
      // Lê o conteúdo M3U8 para reescrever as rotas relativas
      let m3u8Data = '';
      upstreamRes.setEncoding('utf8');
      upstreamRes.on('data', chunk => m3u8Data += chunk);
      upstreamRes.on('end', () => {
        const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);
        const proxyPrefix = '/proxy?url=';
        const rewritten = rewriteM3U8(m3u8Data, baseUrl, proxyPrefix);

        const responseHeaders = {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };

        if (req.method === 'HEAD') {
          res.writeHead(upstreamRes.statusCode || 200, responseHeaders);
          return res.end();
        }

        res.writeHead(upstreamRes.statusCode || 200, responseHeaders);
        res.end(rewritten);
      });
      upstreamRes.on('error', (err) => {
        if (!res.headersSent) sendJSON(res, 502, { error: err.message });
      });
    } else {
      // Segmento binário (.ts, .key, .m4s) - repassa diretamente sem reter RAM ou congelar o fluxo
      const responseHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': upstreamRes.headers['content-type'] || 'video/mp2t',
        'Cache-Control': 'public, max-age=60'
      };

      if (upstreamRes.headers['content-length']) responseHeaders['Content-Length'] = upstreamRes.headers['content-length'];
      if (upstreamRes.headers['content-range']) responseHeaders['Content-Range'] = upstreamRes.headers['content-range'];
      if (upstreamRes.headers['accept-ranges']) responseHeaders['Accept-Ranges'] = upstreamRes.headers['accept-ranges'];

      if (req.method === 'HEAD') {
        res.writeHead(upstreamRes.statusCode || 200, responseHeaders);
        return res.end();
      }

      res.writeHead(upstreamRes.statusCode || 200, responseHeaders);
      upstreamRes.pipe(res);
      upstreamRes.on('error', () => {
        try { res.destroy(); } catch (e) {}
      });
    }
  } catch (err) {
    if (!res.headersSent) {
      sendJSON(res, 502, {
        error: 'Falha no Proxy de Streaming',
        details: err.message,
        targetUrl
      });
    }
  }
}

// Servidor Principal
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const searchParams = reqUrl.searchParams;

  // Responder a preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS, DELETE',
      'Access-Control-Allow-Headers': '*'
    });
    return res.end();
  }

  // Rota: Telemetria de Erros (POST do cliente)
  if (pathname === '/api/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const report = JSON.parse(body || '{}');
        logTelemetryError(report);
        return sendJSON(res, 200, { success: true, message: 'Erro registrado com sucesso na telemetria' });
      } catch (e) {
        return sendJSON(res, 400, { error: 'Payload JSON inválido' });
      }
    });
    return;
  }

  // Rota: Consulta de Telemetria (GET)
  if (pathname === '/api/telemetry' && req.method === 'GET') {
    if (fs.existsSync(ERROR_LOG_FILE)) {
      const logs = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      return res.end(logs);
    }
    return sendJSON(res, 200, { reports: [], message: 'Nenhum erro registrado até o momento' });
  }

  // Rota: Limpar Telemetria (DELETE)
  if (pathname === '/api/telemetry' && req.method === 'DELETE') {
    try {
      if (fs.existsSync(ERROR_LOG_FILE)) fs.unlinkSync(ERROR_LOG_FILE);
      return sendJSON(res, 200, { success: true, message: 'Logs de telemetria limpos' });
    } catch (e) {
      return sendJSON(res, 500, { error: e.message });
    }
  }

  // Rota: Proxy de Streams Inteligente
  if (pathname === '/proxy') {
    return handleStreamProxy(req, res, searchParams.get('url'));
  }

  // Rota: API Canais
  if (pathname === '/api/channels') {
    try {
      if (fs.existsSync(CHANNELS_FILE)) {
        channelsData = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
      }
    } catch (e) {}
    let result = channelsData;
    const groupFilter = searchParams.get('category') || searchParams.get('group');
    const query = (searchParams.get('q') || '').toLowerCase().trim();

    if (groupFilter && groupFilter !== 'ALL') {
      result = result.filter(c => c.group === groupFilter);
    }
    if (query) {
      result = result.filter(c => c.name.toLowerCase().includes(query) || c.group.toLowerCase().includes(query));
    }

    return sendJSON(res, 200, {
      total: result.length,
      channels: result
    });
  }

  // Rota: API Categorias
  if (pathname === '/api/categories') {
    const categoryCounts = {};
    channelsData.forEach(c => {
      categoryCounts[c.group] = (categoryCounts[c.group] || 0) + 1;
    });
    return sendJSON(res, 200, {
      totalChannels: channelsData.length,
      categories: categoryCounts
    });
  }

  // Rota: API Health
  if (pathname === '/api/health') {
    return sendJSON(res, 200, {
      status: 'ONLINE',
      uptimeSeconds: Math.floor(process.uptime()),
      channelsLoaded: channelsData.length,
      nodeVersion: process.version,
      platform: process.platform,
      hasErrorLog: fs.existsSync(ERROR_LOG_FILE)
    });
  }

  // Rota: Download M3U
  if (pathname === '/playlist.m3u') {
    if (fs.existsSync(M3U_FILE)) {
      res.writeHead(200, {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': 'inline; filename="canais_completos.m3u"',
        'Access-Control-Allow-Origin': '*'
      });
      return fs.createReadStream(M3U_FILE).pipe(res);
    }
  }

  // Rota: Versão Mobile Dedicada
  if (pathname === '/mobile') {
    const mobileFile = path.join(PUBLIC_DIR, 'mobile.html');
    if (fs.existsSync(mobileFile)) {
      const acceptEncoding = (req.headers['accept-encoding'] || '').toLowerCase();
      const headers = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Vary': 'Accept-Encoding'
      };
      if (acceptEncoding.includes('gzip')) {
        headers['Content-Encoding'] = 'gzip';
        res.writeHead(200, headers);
        return fs.createReadStream(mobileFile).pipe(zlib.createGzip({ level: 6 })).pipe(res);
      }
      res.writeHead(200, headers);
      return fs.createReadStream(mobileFile).pipe(res);
    }
  }

  // Rota: QR Code para o celular
  if (pathname === '/api/qrcode') {
    const host = req.headers.host || `${getLocalIP()}:${PORT}`;
    const mobileUrl = `http://${host}/mobile`;
    res.writeHead(302, {
      'Location': `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(mobileUrl)}`,
      'Access-Control-Allow-Origin': '*'
    });
    return res.end();
  }

  // Detecção Inteligente de Celular na Raiz: Redireciona automaticamente para a interface mobile dedicada
  const ua = req.headers['user-agent'] || '';
  const isMobileClient = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  if ((pathname === '/' || pathname === '/index.html') && isMobileClient && !searchParams.has('desktop')) {
    res.writeHead(302, {
      'Location': '/mobile',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end();
  }

  // Servir arquivos estáticos de public/
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(PUBLIC_DIR, safePath);

  // Fallback para raiz caso o arquivo não esteja em public
  if (!fs.existsSync(filePath)) {
    const rootFallback = path.join(__dirname, safePath);
    if (fs.existsSync(rootFallback) && !fs.statSync(rootFallback).isDirectory()) {
      filePath = rootFallback;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallbackIndex = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(fallbackIndex)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(fallbackIndex).pipe(res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Arquivo não encontrado');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const acceptEncoding = (req.headers['accept-encoding'] || '').toLowerCase();
    const canGzip = acceptEncoding.includes('gzip');
    const canDeflate = acceptEncoding.includes('deflate');
    const isCompressible = /\.(html|css|js|json|svg|m3u|m3u8)$/i.test(ext) && stats.size > 256;

    const fileHeaders = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
      'Vary': 'Accept-Encoding'
    };

    if (req.method === 'HEAD') {
      if (!isCompressible) fileHeaders['Content-Length'] = stats.size;
      res.writeHead(200, fileHeaders);
      return res.end();
    }

    if (isCompressible && canGzip) {
      fileHeaders['Content-Encoding'] = 'gzip';
      res.writeHead(200, fileHeaders);
      return fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    } else if (isCompressible && canDeflate) {
      fileHeaders['Content-Encoding'] = 'deflate';
      res.writeHead(200, fileHeaders);
      return fs.createReadStream(filePath).pipe(zlib.createDeflate()).pipe(res);
    } else {
      fileHeaders['Content-Length'] = stats.size;
      res.writeHead(200, fileHeaders);
      return fs.createReadStream(filePath).pipe(res);
    }
  });
});

function openBrowser(url) {
  if (process.env.NO_AUTO_OPEN === 'true') return;
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"` :
              process.platform === 'darwin' ? `open "${url}"` :
              `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (!err) {
      console.log(`[IPTV Server] 🌐 Navegador aberto automaticamente em: ${url}`);
    }
  });
}

function startServer(port) {
  server.listen(port, () => {
    const localIp = getLocalIP();
    console.log(`
┌────────────────────────────────────────────────────────┐
│                                                        │
│   🚀 IPTV PRO BRASIL - SERVIDOR ONLINE (v2.0.0)        │
│                                                        │
│   💻 Computador:  http://localhost:${port}                │
│   🌐 Rede Local:  http://${localIp}:${port}               │
│   📱 No Celular:  http://${localIp}:${port}/mobile        │
│                                                        │
│   Recursos Ativos:                                     │
│   • /proxy?url=...   Proxy HLS com Reescrita M3U8      │
│   • /mobile          Reprodutor Dedicado para Celular  │
│   • /api/qrcode      QR Code para Acesso Rápido        │
│   • /api/channels    Grade Completa de Canais          │
│   • /playlist.m3u    Download M3U                      │
│                                                        │
│   Relatório de Erros gravado em: error_reports.log     │
└────────────────────────────────────────────────────────┘
`);
    setTimeout(() => openBrowser(`http://localhost:${port}`), 600);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Verifica se a porta já está ocupada por uma instância do próprio IPTV Pro Brasil
      const checkReq = http.get(`http://localhost:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log(`[IPTV Server] ℹ️ O IPTV Pro Brasil já está ativo na porta ${port}!`);
          openBrowser(`http://localhost:${port}`);
          setTimeout(() => process.exit(0), 1000);
        } else {
          console.warn(`[IPTV Server] Porta ${port} ocupada por outro app. Tentando porta ${port + 1}...`);
          startServer(port + 1);
        }
      });
      checkReq.on('error', () => {
        console.warn(`[IPTV Server] Porta ${port} em uso. Tentando porta ${port + 1}...`);
        startServer(port + 1);
      });
      checkReq.setTimeout(1200, () => {
        checkReq.destroy();
        startServer(port + 1);
      });
    } else {
      console.error('[IPTV Server] Erro fatal no servidor:', err);
    }
  });
}

startServer(PORT);

// Keep-Alive Automático 24/7 (Mantém serviços gratuitos do Render sempre ativos sem hibernar)
function setupKeepAlive() {
  const externalUrl = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  if (!externalUrl) {
    console.log('[Keep-Alive 24/7] ℹ️ RENDER_EXTERNAL_URL não detectado no ambiente local. Sentinela em modo local.');
    return;
  }

  const pingUrl = externalUrl.replace(/\/$/, '') + '/api/health';
  const PING_INTERVAL = 10 * 60 * 1000; // A cada 10 minutos (Render adormece com 15 min de inatividade)

  console.log(`[Keep-Alive 24/7] 🚀 Sentinela ativa! Mantendo o servidor Render 100% acordado em: ${pingUrl}`);

  function doPing() {
    try {
      const isHttps = pingUrl.startsWith('https');
      const client = isHttps ? https : http;
      const pingReq = client.get(pingUrl, { timeout: 20000 }, (pingRes) => {
        console.log(`[Keep-Alive 24/7] 💓 Ping com sucesso (${pingRes.statusCode}) - Servidor Render mantido ativo!`);
        pingRes.resume();
      });
      pingReq.on('error', (err) => {
        console.warn(`[Keep-Alive 24/7] ⚠️ Falha transitória no auto-ping: ${err.message}`);
      });
      pingReq.on('timeout', () => {
        pingReq.destroy();
      });
    } catch (e) {
      console.warn('[Keep-Alive 24/7] Erro ao disparar ping:', e.message);
    }
  }

  // Primeiro ping após 15 segundos para confirmar funcionamento
  setTimeout(doPing, 15000);
  setInterval(doPing, PING_INTERVAL);
}

setupKeepAlive();

