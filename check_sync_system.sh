#!/bin/bash
# 检查同步系统状态

cd "$(dirname "$0")"

echo "🔍 检查Notion同步系统状态"
echo "=========================="

# 检查目录结构
echo "📁 目录结构:"
ls -la backups/notion_sync/ 2>/dev/null | head -5
echo ""

# 检查日志
echo "📝 日志文件:"
ls -la logs/ 2>/dev/null || echo "logs目录不存在"
echo ""

# 检查Python脚本
echo "🐍 Python脚本:"
if [ -f notion_sync.py ]; then
    python3 -m py_compile notion_sync.py 2>/dev/null && echo "✅ notion_sync.py 语法正确"
else
    echo "❌ notion_sync.py 不存在"
fi
echo ""

# 检查环境变量
echo "⚙️ 环境变量:"
if [ -f .env.notion ]; then
    echo "✅ .env.notion 存在"
    grep -q "NOTION_API_KEY" .env.notion && echo "  ✅ NOTION_API_KEY 已配置" || echo "  ❌ NOTION_API_KEY 未配置"
else
    echo "❌ .env.notion 不存在"
    echo "  请复制 .env.notion.example 为 .env.notion 并配置"
fi
echo ""

# 检查定时任务
echo "⏰ 定时任务:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    launchctl list | grep -q "com.smfun.notionsync" && echo "✅ launchd定时任务运行中" || echo "❌ launchd定时任务未运行"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    crontab -l | grep -q "notion_sync.py" && echo "✅ cron定时任务已设置" || echo "❌ cron定时任务未设置"
fi
echo ""

# 运行测试同步
echo "🧪 测试同步:"
python3 notion_sync.py > /tmp/sync_test.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 同步测试成功"
    echo "查看报告: sync_report.md"
else
    echo "❌ 同步测试失败"
    echo "查看日志: /tmp/sync_test.log"
fi

echo ""
echo "🔧 可用命令:"
echo "  ./sync_now.sh      # 手动同步"
echo "  ./check_sync_system.sh # 检查系统"
echo "  python3 daily_summary.py # 生成每日总结"
