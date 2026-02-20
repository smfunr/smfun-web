const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署 SMFunToken 合约...");
  
  // 部署者地址
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", hre.ethers.formatEther(await deployer.getBalance()), "ETH");
  
  // 平台钱包地址（可以设置为部署者地址或其他地址）
  const platformWallet = deployer.address;
  console.log("平台钱包地址:", platformWallet);
  
  // 部署合约
  const SMFunToken = await hre.ethers.getContractFactory("SMFunToken");
  const smfunToken = await SMFunToken.deploy(platformWallet);
  
  await smfunToken.waitForDeployment();
  const contractAddress = await smfunToken.getAddress();
  
  console.log("✅ SMFunToken 合约部署成功!");
  console.log("合约地址:", contractAddress);
  
  // 验证合约信息
  console.log("\n📋 合约信息:");
  console.log("代币名称:", await smfunToken.name());
  console.log("代币符号:", await smfunToken.symbol());
  console.log("总供应量:", hre.ethers.formatEther(await smfunToken.totalSupply()), "SMF");
  console.log("ICO 价格:", hre.ethers.formatEther(await smfunToken.ICO_PRICE()), "ETH/part");
  console.log("最大 parts:", await smfunToken.MAX_PARTS());
  console.log("平台手续费比例:", await smfunToken.PLATFORM_FEE_PERCENT(), "%");
  
  // 保存部署信息到文件
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    platformWallet: platformWallet,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📁 部署信息已保存到: deployments/" + hre.network.name + ".json");
  
  // 如果是测试网，可以自动开始 ICO
  if (hre.network.name === "sepolia" || hre.network.name === "hardhat") {
    console.log("\n🎯 开始 ICO...");
    const tx = await smfunToken.startICO(30); // 30天 ICO
    await tx.wait();
    console.log("✅ ICO 已开始，持续 30 天");
  }
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
