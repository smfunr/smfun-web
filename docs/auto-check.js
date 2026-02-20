// 自动页面检查脚本
const fs = require('fs');
const https = require('https');

const PAGES = [
  { name: 'Home', url: 'https://smfunr.github.io/smfun-web/index.html' },
  { name: 'ICO', url: 'https://smfunr.github.io/smfun-web/ico.html' },
  { name: 'Auto Trading', url: 'https://smfunr.github.io/smfun-web/auto-trading.html' },
  { name: 'Admin Login', url: 'https://smfunr.github.io/smfun-web/admin/login.html' }
];

const CHECK_INTERVAL = 60 * 60 * 1000; // 1小时

function checkPage(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode === 200 });
    }).on('error', (err) => {
      resolve({ status: 0, ok: false, error: err.message });
    });
  });
}

async function checkAllPages() {
  console.log(`\n🔍 [${new Date().toISOString()}] 开始检查页面状态...`);
  
  const results = [];
  for (const page of PAGES) {
    const result = await checkPage(page.url);
    results.push({ ...page, ...result });
    
    const status = result.ok ? '✅' : '❌';
    console.log(`${status} ${page.name}: ${page.url} (${result.status || 'ERROR'})`);
    
    if (!result.ok) {
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
  }
  
  // 记录到日志
  const logEntry = {
    timestamp: new Date().toISOString(),
    results: results.map(r => ({
      name: r.name,
      url: r.url,
      status: r.status,
      ok: r.ok
    }))
  };
  
  const logFile = 'page-check-log.json';
  let logs = [];
  if (fs.existsSync(logFile)) {
    logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  }
  logs.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  
  console.log(`📊 检查完成，记录到 ${logFile}`);
  
  // 如果有页面失败，发送警报
  const failedPages = results.filter(r => !r.ok);
  if (failedPages.length > 0) {
    console.log(`🚨 警报：${failedPages.length} 个页面访问失败！`);
    // 这里可以添加通知逻辑（邮件、Telegram等）
  }
  
  return results;
}

// 立即执行一次
checkAllPages();

// 定时执行
setInterval(checkAllPages, CHECK_INTERVAL);

console.log(`⏰ 页面检查服务已启动，每 ${CHECK_INTERVAL / 1000 / 60} 分钟检查一次`);
