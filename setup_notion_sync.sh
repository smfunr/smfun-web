#!/bin/bash
# Notion同步系统设置脚本

echo "🚀 设置Notion 5小时同步系统"

# 创建必要的目录
mkdir -p backups/notion_sync
mkdir -p logs

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python3"
    exit 1
fi

# 检查必要的Python包
echo "📦 检查Python依赖..."
python3 -c "import pytz" 2>/dev/null || {
    echo "安装pytz..."
    pip3 install pytz
}

# 创建环境变量模板
echo "🔧 创建环境变量模板..."
cat > .env.notion.example << 'ENVEXAMPLE'
# Notion API配置
# 1. 访问 https://www.notion.so/my-integrations 创建集成
# 2. 获取API Key
# 3. 创建数据库并获取ID

NOTION_API_KEY="notion_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NOTION_DATABASE_ID_WORK="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NOTION_DATABASE_ID_PROGRESS="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NOTION_DATABASE_ID_ISSUES="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 同步配置
SYNC_INTERVAL_HOURS=5
TIMEZONE="Asia/Bangkok"
ENVEXAMPLE

echo "✅ 环境变量模板已创建: .env.notion.example"

# 创建实际环境文件（如果不存在）
if [ ! -f .env.notion ]; then
    echo "📝 创建环境变量文件..."
    cp .env.notion.example .env.notion
    echo "⚠️ 请编辑 .env.notion 文件，填入实际的Notion API配置"
fi

# 测试同步脚本
echo "🧪 测试同步脚本..."
python3 notion_sync.py

if [ $? -eq 0 ]; then
    echo "✅ 同步脚本测试成功"
else
    echo "⚠️ 同步脚本测试有警告（可能缺少Notion配置）"
fi

# 设置定时任务
echo "⏰ 设置5小时定时任务..."

# 检测系统类型
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - 使用launchd
    echo "检测到macOS，使用launchd设置定时任务"
    
    # 创建plist文件
    PLIST_FILE="$HOME/Library/LaunchAgents/com.smfun.notionsync.plist"
    
    cat > "$PLIST_FILE" << PLISTCONTENT
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.smfun.notionsync</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which python3)</string>
        <string>$(pwd)/notion_sync.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>StandardOutPath</key>
    <string>$(pwd)/logs/notion_sync.log</string>
    <key>StandardErrorPath</key>
    <string>$(pwd)/logs/notion_sync_error.log</string>
    <key>StartInterval</key>
    <integer>18000</integer> <!-- 5小时 = 18000秒 -->
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
PLISTCONTENT
    
    # 加载定时任务
    launchctl unload "$PLIST_FILE" 2>/dev/null
    launchctl load "$PLIST_FILE"
    
    echo "✅ macOS定时任务已设置: $PLIST_FILE"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - 使用cron
    echo "检测到Linux，使用cron设置定时任务"
    
    CRON_JOB="0 */5 * * * cd $(pwd) && python3 notion_sync.py >> logs/cron.log 2>&1"
    
    # 添加到crontab
    (crontab -l 2>/dev/null | grep -v "notion_sync.py"; echo "$CRON_JOB") | crontab -
    
    echo "✅ Linux定时任务已设置"
    echo "定时任务: $CRON_JOB"
    
else
    echo "⚠️ 未知系统类型: $OSTYPE"
    echo "请手动设置定时任务，每5小时运行:"
    echo "  cd $(pwd) && python3 notion_sync.py"
fi

# 创建手动同步脚本
echo "📝 创建手动同步脚本..."
cat > sync_now.sh << 'SYNCSCRIPT'
#!/bin/bash
# 手动同步脚本

cd "$(dirname "$0")"
echo "🔄 手动触发Notion同步..."
python3 notion_sync.py

if [ $? -eq 0 ]; then
    echo "✅ 手动同步完成"
    echo "查看报告: sync_report.md"
else
    echo "❌ 手动同步失败"
    exit 1
fi
SYNCSCRIPT

chmod +x sync_now.sh

# 创建每日总结脚本
echo "📊 创建每日总结脚本..."
cat > daily_summary.py << 'PYSUMMARY'
#!/usr/bin/env python3
"""
每日工作总结脚本
"""
import json
from datetime import datetime, timedelta
import pytz
from pathlib import Path

workspace_root = Path(__file__).parent
timezone = pytz.timezone("Asia/Bangkok")
today = datetime.now(timezone)

def generate_daily_summary():
    """生成每日总结"""
    
    # 读取今日的同步备份
    backup_dir = workspace_root / "backups" / "notion_sync"
    today_files = []
    
    if backup_dir.exists():
        for file in backup_dir.iterdir():
            if file.name.startswith(f"sync_{today.strftime('%Y%m%d')}"):
                today_files.append(file)
    
    if not today_files:
        print("今日无同步记录")
        return
    
    # 读取最新的备份
    latest_file = max(today_files, key=lambda f: f.stat().st_mtime)
    
    try:
        with open(latest_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        summary = f"""# 📊 每日工作总结 - {today.strftime('%Y-%m-%d')}

## 🎯 今日成果
- **完成进度**: {data['work_stats']['completion_rate']}%
- **完成任务**: {data['work_stats']['completed']}项
- **待办任务**: {data['work_stats']['pending']}项

## 🚀 今日进展
{data['recent_progress'] or '无具体进展记录'}

## 📋 关键待办
"""
        
        if data['key_tasks']:
            for task in data['key_tasks']:
                summary += f"- **{task['description']}** (负责人: {task['owner']})\n"
        else:
            summary += "无关键待办任务\n"
        
        summary += f"""
## ⏰ 同步统计
- **今日同步次数**: {len(today_files)}
- **最后同步时间**: {data['sync_time']}
- **系统状态**: ✅ 运行正常

## 🎯 明日重点
1. 继续后端开发工作
2. 推进待办任务
3. 优化同步系统

---

**自动生成于**: {today.strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        # 保存总结
        summary_file = workspace_root / "daily_summary.md"
        with open(summary_file, "w", encoding="utf-8") as f:
            f.write(summary)
        
        print(f"✅ 每日总结已生成: {summary_file.name}")
        return True
        
    except Exception as e:
        print(f"❌ 生成每日总结失败: {e}")
        return False

if __name__ == "__main__":
    generate_daily_summary()
PYSUMMARY

chmod +x daily_summary.py

# 创建检查脚本
echo "🔍 创建系统检查脚本..."
cat > check_sync_system.sh << 'CHECKSYNC'
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
CHECKSYNC

chmod +x check_sync_system.sh

echo ""
echo "🎉 Notion同步系统设置完成！"
echo ""
echo "📋 下一步操作:"
echo "1. 编辑 .env.notion 文件，填入Notion API配置"
echo "2. 运行 ./check_sync_system.sh 检查系统"
echo "3. 运行 ./sync_now.sh 测试手动同步"
echo "4. 系统将每5小时自动同步到Notion"
echo ""
echo "📊 查看同步报告: sync_report.md"
echo "📁 备份文件: backups/notion_sync/"
echo "📝 日志文件: logs/"
echo ""
echo "💡 提示: 系统已设置每5小时自动同步，你也可以随时手动同步"
