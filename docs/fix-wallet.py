import re

# 读取ICO页面，提取真实钱包连接代码
with open('ico.html', 'r') as f:
    ico_content = f.read()

# 提取真实钱包连接函数（从connectWallet函数开始）
wallet_pattern = r'async function connectWallet\(walletType\) \{[\s\S]*?\n\s*\}'
wallet_match = re.search(wallet_pattern, ico_content)

if not wallet_match:
    print("❌ 无法从ICO页面提取钱包连接函数")
    exit(1)

real_wallet_function = wallet_match.group(0)
print(f"✅ 提取到真实钱包连接函数，长度: {len(real_wallet_function)} 字符")

# 读取首页
with open('index.html', 'r') as f:
    index_content = f.read()

# 找到并替换模拟的钱包连接函数
simulated_pattern = r'function connectWallet\(walletType\) \{[\s\S]*?setTimeout\([\s\S]*?\n\s*\}'
simulated_match = re.search(simulated_pattern, index_content)

if simulated_match:
    print(f"✅ 找到模拟钱包连接函数，长度: {len(simulated_match.group(0))} 字符")
    
    # 替换为真实函数
    index_content = index_content.replace(simulated_match.group(0), real_wallet_function)
    
    # 更新函数调用为异步
    index_content = index_content.replace('connectWallet(wallet);', 'await connectWallet(wallet);')
    
    # 更新事件监听器为异步
    index_content = index_content.replace('option.addEventListener(\'click\', () => {', 'option.addEventListener(\'click\', async () => {')
    
    # 写入更新后的文件
    with open('index.html', 'w') as f:
        f.write(index_content)
    
    print("✅ 首页钱包连接已更新为真实功能")
else:
    print("❌ 未找到模拟钱包连接函数")
