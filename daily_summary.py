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
