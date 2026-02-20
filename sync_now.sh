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
