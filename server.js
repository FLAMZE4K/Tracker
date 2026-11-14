const express = require('express');
const app = express();

app.get('/track', (req, res) => {
  const ua = req.headers['user-agent'];
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const time = new Date().toISOString();

  let device = 'Unknown';
  if (/iPhone/.test(ua)) {
    const match = ua.match(/iPhone OS ([\d_]+)/);
    const ios = match ? match[1].replace(/_/g, '.') : '';
    if (ios.startsWith('17')) device = 'iPhone 15 series (iOS 17)';
    else if (ios.startsWith('16')) device = 'iPhone 14 series (iOS 16)';
    else if (ios.startsWith('15')) device = 'iPhone 13 series (iOS 15)';
    else device = `iPhone (iOS ${ios})`;
  } else if (/SM-S928/.test(ua)) {
    device = 'Samsung Galaxy S24 Ultra';
  } else if (/SM-S926/.test(ua)) {
    device = 'Samsung Galaxy S24+';
  } else if (/SM-S921/.test(ua)) {
    device = 'Samsung Galaxy S24';
  } else if (/SM-S918/.test(ua)) {
    device = 'Samsung Galaxy S23 Ultra';
  } else if (/SM-A/.test(ua)) {
    const match = ua.match(/SM-A\d+/);
    device = `Samsung Galaxy A series (${match ? match[0] : ''})`;
  } else if (/SM-/.test(ua)) {
    const match = ua.match(/SM-[A-Z0-9]+/);
    device = `Samsung (${match ? match[0] : ''})`;
  } else if (/Redmi/.test(ua)) {
    const match = ua.match(/Redmi [^\s;)]+/);
    device = match ? match[0] : 'Redmi';
  } else if (/POCO/.test(ua)) {
    const match = ua.match(/POCO [^\s;)]+/);
    device = match ? match[0] : 'POCO';
  } else if (/INFINIX/.test(ua)) {
    const match = ua.match(/INFINIX [^\s;)]+/);
    device = match ? match[0] : 'Infinix';
  } else if (/Tecno/.test(ua)) {
    device = 'Tecno';
  } else if (/Itel/.test(ua)) {
    device = 'Itel';
  } else if (/Android/.test(ua)) {
    const match = ua.match(/;\s([^;)]+)\sBuild/);
    device = match ? match[1].trim() : 'Android device';
  }

  console.log(`\n========== HIT ==========`);
  console.log(`TIME   : ${time}`);
  console.log(`DEVICE : ${device}`);
  console.log(`IP     : ${ip}`);
  console.log(`UA     : ${ua}`);
  console.log(`=========================\n`);

  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Voice message</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0b141a;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .chat-wrap { width: 100%; max-width: 420px; padding: 20px 12px; }
  .msg-bubble {
    background: #202c33;
    border-radius: 8px;
    padding: 10px 12px;
    max-width: 280px;
    margin-left: auto;
    position: relative;
  }
  .msg-bubble::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 0;
    border: 8px solid transparent;
    border-left-color: #202c33;
    border-top-color: #202c33;
  }
  .voice-row { display: flex; align-items: center; gap: 10px; }
  .play-btn {
    width: 42px; height: 42px;
    border-radius: 50%;
    background: #00a884;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .play-btn svg { fill: white; width: 18px; height: 18px; margin-left: 2px; }
  .waveform {
    flex: 1; height: 28px;
    display: flex; align-items: center; gap: 2px;
  }
  .bar { width: 3px; background: #8696a0; border-radius: 2px; }
  .bar.active {
    background: #00a884;
    animation: pulse 0.6s ease infinite alternate;
  }
  @keyframes pulse {
    from { transform: scaleY(0.6); }
    to { transform: scaleY(1.2); }
  }
  .duration { color: #8696a0; font-size: 12px; margin-top: 4px; text-align: right; }
  .meta { display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 4px; }
  .time { color: #8696a0; font-size: 11px; }
  .ticks { color: #53bdeb; font-size: 13px; }
  .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #2a3942;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .avatar svg { width: 22px; height: 22px; fill: #8696a0; }
</style>
</head>
<body>
<div class="chat-wrap">
  <div style="display:flex; align-items:flex-end; gap:8px;">
    <div class="avatar">
      <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
    </div>
    <div class="msg-bubble">
      <div class="voice-row">
        <button class="play-btn" onclick="playVoice(this)">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="waveform" id="waveform"></div>
      </div>
      <div class="duration" id="dur">0:12</div>
      <div class="meta">
        <span class="time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
        <span class="ticks">✓✓</span>
      </div>
    </div>
  </div>
</div>
<script>
  const wf = document.getElementById('waveform');
  const heights = [8,12,18,24,20,14,22,16,10,20,24,18,12,8,16,22,18,14,20,24,16,10,18,22,14,8,20,16,24,18];
  heights.forEach(h => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = h + 'px';
    wf.appendChild(bar);
  });

  let playing = false;
  let timer = null;
  let seconds = 0;

  function playVoice(btn) {
    if (playing) return;
    playing = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" style="fill:white;width:18px;height:18px;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    const bars = document.querySelectorAll('.bar');
    bars.forEach((b, i) => setTimeout(() => b.classList.add('active'), i * 30));
    const durEl = document.getElementById('dur');
    timer = setInterval(() => {
      seconds++;
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      durEl.textContent = m + ':' + (s < 10 ? '0' + s : s);
      if (seconds >= 12) clearInterval(timer);
    }, 1000);
  }
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server live on port ${PORT}`));
