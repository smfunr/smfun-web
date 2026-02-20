// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AutoTrading - 自动交易合约
 * @dev 支持自动交易、预测市场、条件触发交易
 */
contract AutoTrading is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    
    // 交易对
    struct TradingPair {
        address baseToken;  // 基础代币（如 ETH）
        address quoteToken; // 计价代币（如 USDT）
        uint256 minTradeAmount; // 最小交易量
        uint256 maxTradeAmount; // 最大交易量
        bool active; // 是否激活
    }
    
    // 交易策略
    struct TradingStrategy {
        uint256 id;
        address user;
        string name;
        uint8 strategyType; // 1: 趋势跟踪, 2: 均值回归, 3: 网格交易, 4: 预测市场
        address tradingPair;
        uint256 initialCapital;
        uint256 currentCapital;
        uint256 profitLoss; // 盈亏
        uint256 totalTrades;
        uint256 winRate; // 胜率
        bool active;
        uint256 createdAt;
        uint256 lastTradeAt;
    }
    
    // 交易订单
    struct TradeOrder {
        uint256 id;
        uint256 strategyId;
        uint8 orderType; // 1: 买入, 2: 卖出
        uint256 amount;
        uint256 price;
        uint8 status; // 1: 待执行, 2: 已执行, 3: 已取消, 4: 失败
        uint256 createdAt;
        uint256 executedAt;
        string reason; // 交易原因
    }
    
    // 预测市场
    struct PredictionMarket {
        uint256 id;
        string title;
        string description;
        uint256 endTime;
        uint256 totalPool;
        uint256 yesPool;
        uint256 noPool;
        uint8 result; // 0: 未出结果, 1: 是, 2: 否
        bool active;
        address creator;
    }
    
    // 预测投注
    struct PredictionBet {
        uint256 marketId;
        address user;
        bool prediction; // true: 是, false: 否
        uint256 amount;
        uint256 potentialPayout;
        bool claimed;
    }
    
    // 状态变量
    mapping(uint256 => TradingStrategy) public strategies;
    mapping(uint256 => TradeOrder) public orders;
    mapping(uint256 => PredictionMarket) public predictionMarkets;
    mapping(uint256 => mapping(address => PredictionBet)) public predictionBets;
    
    uint256 public strategyCounter;
    uint256 public orderCounter;
    uint256 public marketCounter;
    
    // 手续费配置
    uint256 public tradingFeePercent = 10; // 0.1%
    uint256 public predictionFeePercent = 20; // 0.2%
    address public feeWallet;
    
    // 事件
    event StrategyCreated(uint256 indexed strategyId, address indexed user, string name);
    event StrategyUpdated(uint256 indexed strategyId, bool active);
    event TradeExecuted(uint256 indexed orderId, uint256 strategyId, uint8 orderType, uint256 amount, uint256 price);
    event PredictionMarketCreated(uint256 indexed marketId, string title, uint256 endTime);
    event PredictionBetPlaced(uint256 indexed marketId, address indexed user, bool prediction, uint256 amount);
    event PredictionResultSet(uint256 indexed marketId, uint8 result);
    event PredictionPayoutClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    
    constructor(address _feeWallet) {
        feeWallet = _feeWallet;
    }
    
    // ========== 自动交易功能 ==========
    
    /**
     * @dev 创建交易策略
     */
    function createStrategy(
        string memory _name,
        uint8 _strategyType,
        address _tradingPair,
        uint256 _initialCapital
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= _initialCapital, "Insufficient capital");
        require(_strategyType >= 1 && _strategyType <= 4, "Invalid strategy type");
        
        strategyCounter++;
        
        strategies[strategyCounter] = TradingStrategy({
            id: strategyCounter,
            user: msg.sender,
            name: _name,
            strategyType: _strategyType,
            tradingPair: _tradingPair,
            initialCapital: _initialCapital,
            currentCapital: _initialCapital,
            profitLoss: 0,
            totalTrades: 0,
            winRate: 0,
            active: true,
            createdAt: block.timestamp,
            lastTradeAt: 0
        });
        
        emit StrategyCreated(strategyCounter, msg.sender, _name);
        
        return strategyCounter;
    }
    
    /**
     * @dev 执行交易（由预言机或外部调用）
     */
    function executeTrade(
        uint256 _strategyId,
        uint8 _orderType,
        uint256 _amount,
        uint256 _price,
        string memory _reason
    ) external onlyOwner nonReentrant returns (uint256) {
        TradingStrategy storage strategy = strategies[_strategyId];
        require(strategy.active, "Strategy not active");
        require(strategy.user != address(0), "Strategy not found");
        
        // 计算手续费
        uint256 fee = _amount.mul(_price).mul(tradingFeePercent).div(10000);
        uint256 tradeValue = _amount.mul(_price);
        
        require(strategy.currentCapital >= tradeValue.add(fee), "Insufficient capital");
        
        orderCounter++;
        
        orders[orderCounter] = TradeOrder({
            id: orderCounter,
            strategyId: _strategyId,
            orderType: _orderType,
            amount: _amount,
            price: _price,
            status: 2, // 已执行
            createdAt: block.timestamp,
            executedAt: block.timestamp,
            reason: _reason
        });
        
        // 更新策略状态
        strategy.totalTrades++;
        strategy.lastTradeAt = block.timestamp;
        
        // 扣除资金（模拟交易）
        strategy.currentCapital = strategy.currentCapital.sub(tradeValue).sub(fee);
        
        // 转账手续费到手续费钱包
        payable(feeWallet).transfer(fee);
        
        emit TradeExecuted(orderCounter, _strategyId, _orderType, _amount, _price);
        
        return orderCounter;
    }
    
    /**
     * @dev 更新策略盈亏
     */
    function updateStrategyProfitLoss(
        uint256 _strategyId,
        int256 _profitLoss
    ) external onlyOwner {
        TradingStrategy storage strategy = strategies[_strategyId];
        
        if (_profitLoss > 0) {
            strategy.profitLoss = strategy.profitLoss.add(uint256(_profitLoss));
            strategy.currentCapital = strategy.currentCapital.add(uint256(_profitLoss));
        } else {
            strategy.profitLoss = strategy.profitLoss.sub(uint256(-_profitLoss));
            strategy.currentCapital = strategy.currentCapital.sub(uint256(-_profitLoss));
        }
        
        // 更新胜率（简化计算）
        if (strategy.totalTrades > 0) {
            uint256 winningTrades = strategy.totalTrades.mul(strategy.winRate).div(100);
            if (_profitLoss > 0) {
                winningTrades = winningTrades.add(1);
            }
            strategy.winRate = winningTrades.mul(100).div(strategy.totalTrades);
        }
    }
    
    /**
     * @dev 启用/禁用策略
     */
    function toggleStrategy(uint256 _strategyId, bool _active) external {
        TradingStrategy storage strategy = strategies[_strategyId];
        require(strategy.user == msg.sender, "Not strategy owner");
        
        strategy.active = _active;
        
        emit StrategyUpdated(_strategyId, _active);
    }
    
    /**
     * @dev 提取策略资金
     */
    function withdrawFromStrategy(uint256 _strategyId, uint256 _amount) external nonReentrant {
        TradingStrategy storage strategy = strategies[_strategyId];
        require(strategy.user == msg.sender, "Not strategy owner");
        require(strategy.currentCapital >= _amount, "Insufficient capital");
        
        strategy.currentCapital = strategy.currentCapital.sub(_amount);
        strategy.active = false;
        
        payable(msg.sender).transfer(_amount);
    }
    
    // ========== 预测市场功能 ==========
    
    /**
     * @dev 创建预测市场
     */
    function createPredictionMarket(
        string memory _title,
        string memory _description,
        uint256 _durationHours
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_durationHours > 0 && _durationHours <= 720, "Duration 1-720 hours");
        
        marketCounter++;
        
        predictionMarkets[marketCounter] = PredictionMarket({
            id: marketCounter,
            title: _title,
            description: _description,
            endTime: block.timestamp.add(_durationHours.mul(1 hours)),
            totalPool: 0,
            yesPool: 0,
            noPool: 0,
            result: 0,
            active: true,
            creator: msg.sender
        });
        
        emit PredictionMarketCreated(marketCounter, _title, predictionMarkets[marketCounter].endTime);
        
        return marketCounter;
    }
    
    /**
     * @dev 投注预测市场
     */
    function betOnPrediction(
        uint256 _marketId,
        bool _prediction
    ) external payable nonReentrant {
        PredictionMarket storage market = predictionMarkets[_marketId];
        require(market.active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");
        require(msg.value > 0, "Bet amount required");
        
        // 检查是否已投注
        require(predictionBets[_marketId][msg.sender].amount == 0, "Already bet");
        
        // 计算手续费
        uint256 fee = msg.value.mul(predictionFeePercent).div(10000);
        uint256 betAmount = msg.value.sub(fee);
        
        // 更新资金池
        market.totalPool = market.totalPool.add(betAmount);
        if (_prediction) {
            market.yesPool = market.yesPool.add(betAmount);
        } else {
            market.noPool = market.noPool.add(betAmount);
        }
        
        // 计算潜在回报
        uint256 potentialPayout = calculatePayout(_marketId, _prediction, betAmount);
        
        // 记录投注
        predictionBets[_marketId][msg.sender] = PredictionBet({
            marketId: _marketId,
            user: msg.sender,
            prediction: _prediction,
            amount: betAmount,
            potentialPayout: potentialPayout,
            claimed: false
        });
        
        // 转账手续费
        payable(feeWallet).transfer(fee);
        
        emit PredictionBetPlaced(_marketId, msg.sender, _prediction, betAmount);
    }
    
    /**
     * @dev 计算潜在回报
     */
    function calculatePayout(
        uint256 _marketId,
        bool _prediction,
        uint256 _betAmount
    ) public view returns (uint256) {
        PredictionMarket memory market = predictionMarkets[_marketId];
        
        if (_prediction) {
            if (market.yesPool == 0) return _betAmount.mul(2);
            return _betAmount.mul(market.totalPool).div(market.yesPool);
        } else {
            if (market.noPool == 0) return _betAmount.mul(2);
            return _betAmount.mul(market.totalPool).div(market.noPool);
        }
    }
    
    /**
     * @dev 设置预测结果（仅创建者或预言机）
     */
    function setPredictionResult(
        uint256 _marketId,
        uint8 _result
    ) external {
        PredictionMarket storage market = predictionMarkets[_marketId];
        require(market.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(market.active, "Market not active");
        require(block.timestamp >= market.endTime, "Market not ended");
        require(_result == 1 || _result == 2, "Invalid result");
        
        market.result = _result;
        market.active = false;
        
        emit PredictionResultSet(_marketId, _result);
    }
    
    /**
     * @dev 领取预测奖励
     */
    function claimPredictionPayout(uint256 _marketId) external nonReentrant {
        PredictionMarket storage market = predictionMarkets[_marketId];
        require(!market.active, "Market still active");
        require(market.result > 0, "Result not set");
        
        PredictionBet storage bet = predictionBets[_marketId][msg.sender];
        require(bet.amount > 0, "No bet found");
        require(!bet.claimed, "Already claimed");
        
        bool userWon = (market.result == 1 && bet.prediction) || (market.result == 2 && !bet.prediction);
        require(userWon, "Bet lost");
        
        uint256 payout = bet.potentialPayout;
        require(payout <= address(this).balance, "Insufficient contract balance");
        
        bet.claimed = true;
        payable(msg.sender).transfer(payout);
        
        emit PredictionPayoutClaimed(_marketId, msg.sender, payout);
    }
    
    /**
     * @dev 获取策略信息
     */
    function getStrategyInfo(uint256 _strategyId) external view returns (
        address user,
        string memory name,
        uint8 strategyType,
        uint256 initialCapital,
        uint256 currentCapital,
        int256 profitLoss,
        uint256 totalTrades,
        uint256 winRate,
        bool active
    ) {
        TradingStrategy memory strategy = strategies[_strategyId];
        return (
            strategy.user,
            strategy.name,
            strategy.strategyType,
            strategy.initialCapital,
            strategy.currentCapital,
            int256(strategy.profitLoss),
            strategy.totalTrades,
            strategy.winRate,
            strategy.active
        );
    }
    
    /**
     * @dev 获取市场信息
     */
    function getMarketInfo(uint256 _marketId) external view returns (
        string memory title,
        uint256 endTime,
        uint256 totalPool,
        uint256 yesPool,
        uint256 noPool,
        uint8 result,
        bool active
    ) {
        PredictionMarket memory market = predictionMarkets[_marketId];
        return (
            market.title,
            market.endTime,
            market.totalPool,
            market.yesPool,
            market.noPool,
            market.result,
            market.active
        );
    }
    
    /**
     * @dev 接收 ETH
     */
    receive() external payable {}
}
