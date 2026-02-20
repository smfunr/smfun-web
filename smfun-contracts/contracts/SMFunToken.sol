// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title SMFunToken - sm.fun 平台代币
 * @dev ERC-20 代币，用于 ICO 和平台权益分配
 */
contract SMFunToken is ERC20, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    
    // ICO 配置
    uint256 public constant TOTAL_SUPPLY = 10_000_000 * 10**18; // 1000万代币
    uint256 public constant ICO_PRICE = 0.1 ether; // 0.1 ETH 购买 1 part
    uint256 public constant PARTS_PER_TOKEN = 1_000; // 1 token = 1000 parts
    uint256 public constant MAX_PARTS = 10_000; // 最多 10,000 parts
    uint256 public constant PLATFORM_FEE_PERCENT = 35; // 35% 平台手续费
    
    // ICO 状态
    uint256 public partsSold;
    uint256 public icoEndTime;
    bool public icoActive;
    
    // 参与者信息
    struct Participant {
        uint256 partsBought;
        uint256 totalPaid;
        uint256 rewardsClaimed;
        bool exists;
    }
    
    mapping(address => Participant) public participants;
    address[] public participantAddresses;
    
    // 平台钱包
    address public platformWallet;
    
    // 事件
    event ICOStarted(uint256 endTime);
    event ICOEnded(uint256 totalRaised, uint256 totalPartsSold);
    event PartsPurchased(address indexed buyer, uint256 parts, uint256 amount);
    event RewardsDistributed(address indexed participant, uint256 amount);
    event PlatformFeeWithdrawn(address indexed wallet, uint256 amount);
    
    /**
     * @dev 构造函数
     * @param _platformWallet 平台钱包地址
     */
    constructor(address _platformWallet) ERC20("SMFun Token", "SMF") {
        platformWallet = _platformWallet;
        _mint(address(this), TOTAL_SUPPLY); // 铸造所有代币到合约
    }
    
    /**
     * @dev 开始 ICO
     * @param _durationDays ICO 持续时间（天）
     */
    function startICO(uint256 _durationDays) external onlyOwner {
        require(!icoActive, "ICO already active");
        require(partsSold == 0, "ICO already started");
        
        icoActive = true;
        icoEndTime = block.timestamp.add(_durationDays.mul(1 days));
        
        emit ICOStarted(icoEndTime);
    }
    
    /**
     * @dev 购买 parts
     */
    function buyParts() external payable nonReentrant {
        require(icoActive, "ICO not active");
        require(block.timestamp <= icoEndTime, "ICO ended");
        require(msg.value > 0, "No ETH sent");
        
        // 计算可购买的 parts
        uint256 maxParts = MAX_PARTS.sub(partsSold);
        uint256 partsToBuy = msg.value.div(ICO_PRICE);
        
        if (partsToBuy > maxParts) {
            partsToBuy = maxParts;
            // 退回多余的 ETH
            uint256 excess = msg.value.sub(partsToBuy.mul(ICO_PRICE));
            if (excess > 0) {
                payable(msg.sender).transfer(excess);
            }
        }
        
        require(partsToBuy > 0, "Not enough ETH to buy parts");
        
        // 更新状态
        partsSold = partsSold.add(partsToBuy);
        
        // 记录参与者
        if (!participants[msg.sender].exists) {
            participants[msg.sender] = Participant({
                partsBought: partsToBuy,
                totalPaid: msg.value,
                rewardsClaimed: 0,
                exists: true
            });
            participantAddresses.push(msg.sender);
        } else {
            participants[msg.sender].partsBought = participants[msg.sender].partsBought.add(partsToBuy);
            participants[msg.sender].totalPaid = participants[msg.sender].totalPaid.add(msg.value);
        }
        
        // 分配代币（1 part = 1000 tokens）
        uint256 tokensToTransfer = partsToBuy.mul(PARTS_PER_TOKEN).mul(10**18);
        _transfer(address(this), msg.sender, tokensToTransfer);
        
        emit PartsPurchased(msg.sender, partsToBuy, msg.value);
        
        // 检查 ICO 是否结束
        if (partsSold == MAX_PARTS) {
            _endICO();
        }
    }
    
    /**
     * @dev 结束 ICO
     */
    function endICO() external onlyOwner {
        require(icoActive, "ICO not active");
        _endICO();
    }
    
    /**
     * @dev 内部结束 ICO 函数
     */
    function _endICO() internal {
        icoActive = false;
        
        // 计算总募集金额
        uint256 totalRaised = address(this).balance;
        
        emit ICOEnded(totalRaised, partsSold);
    }
    
    /**
     * @dev 分发平台手续费奖励
     * @param _totalFees 总手续费金额
     */
    function distributeRewards(uint256 _totalFees) external onlyOwner nonReentrant {
        require(!icoActive, "ICO still active");
        require(_totalFees > 0, "No fees to distribute");
        
        uint256 totalRewards = _totalFees.mul(PLATFORM_FEE_PERCENT).div(100);
        
        // 按 parts 比例分配
        for (uint256 i = 0; i < participantAddresses.length; i++) {
            address participant = participantAddresses[i];
            uint256 participantParts = participants[participant].partsBought;
            
            if (participantParts > 0) {
                uint256 reward = totalRewards.mul(participantParts).div(partsSold);
                
                if (reward > 0) {
                    // 转账奖励
                    payable(participant).transfer(reward);
                    participants[participant].rewardsClaimed = participants[participant].rewardsClaimed.add(reward);
                    
                    emit RewardsDistributed(participant, reward);
                }
            }
        }
    }
    
    /**
     * @dev 提取平台手续费（剩余的 65%）
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        require(!icoActive, "ICO still active");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        payable(platformWallet).transfer(balance);
        
        emit PlatformFeeWithdrawn(platformWallet, balance);
    }
    
    /**
     * @dev 获取 ICO 信息
     */
    function getICOInfo() external view returns (
        uint256 totalParts,
        uint256 soldParts,
        uint256 remainingParts,
        uint256 pricePerPart,
        bool active,
        uint256 endTime
    ) {
        return (
            MAX_PARTS,
            partsSold,
            MAX_PARTS.sub(partsSold),
            ICO_PRICE,
            icoActive,
            icoEndTime
        );
    }
    
    /**
     * @dev 获取参与者信息
     */
    function getParticipantInfo(address _participant) external view returns (
        uint256 partsBought,
        uint256 totalPaid,
        uint256 rewardsClaimed,
        uint256 tokensHeld
    ) {
        Participant memory p = participants[_participant];
        uint256 tokens = balanceOf(_participant);
        
        return (
            p.partsBought,
            p.totalPaid,
            p.rewardsClaimed,
            tokens
        );
    }
    
    /**
     * @dev 获取合约余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 接收 ETH（用于直接转账）
     */
    receive() external payable {
        if (icoActive) {
            buyParts();
        }
    }
}
