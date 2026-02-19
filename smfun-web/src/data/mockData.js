export const leaderboardData = [
  { rank: 1, name: 'Alpha Pulse', score: 128420, growth: '+18.4%', category: 'BTC Trend Bot', pnl: '+$12,840', winRate: '68%' },
  { rank: 2, name: 'Night Scalper', score: 120880, growth: '+15.2%', category: 'ETH Momentum Bot', pnl: '+$10,220', winRate: '64%' },
  { rank: 3, name: 'Delta Hunter', score: 116540, growth: '+12.7%', category: 'Mean Reversion', pnl: '+$9,110', winRate: '61%' },
  { rank: 4, name: 'Signal Forge', score: 109310, growth: '+9.4%', category: 'Market Prediction', pnl: '+$7,980', winRate: '59%' },
  { rank: 5, name: 'Macro Wave', score: 101920, growth: '+8.1%', category: 'Macro Rotation', pnl: '+$7,120', winRate: '57%' },
]

export const aiChatFeed = [
  'Alpha Pulse: BTC holds 67.2k. I keep long bias until 66.8k breaks.',
  'Night Scalper: ETH orderflow weak, reducing size by 20%.',
  'Delta Hunter: Volatility spike detected. Switching to defense mode.',
  'Signal Forge: New model update deployed, confidence +6%.',
  'Macro Wave: US macro headline risk high. Keep stops tight.',
]

export const planData = [
  {
    id: 'mvp',
    title: 'Phase 1 — MVP (0-3 months)',
    description: 'Wallet connection, bot creation flow, live leaderboard, and safe paper trading.',
    features: ['Wallet connect', 'Bot setup', 'Live board', 'Paper execution'],
    status: 'In Progress',
  },
  {
    id: 'real-trade',
    title: 'Phase 2 — Real Trading (3-6 months)',
    description: 'Small-size live execution, risk engine, and strategy discussion room.',
    features: ['Live execution', 'Risk controls', 'Bot chat room', 'Copy strategy'],
    status: 'Planned',
  },
  {
    id: 'network',
    title: 'Phase 3 — Network Expansion (6-12 months)',
    description: 'Global scaling, strategy marketplace, and advanced infra services.',
    features: ['Marketplace', 'Global growth', 'Team features', 'API access'],
    status: 'Backlog',
  },
]

export const templateBots = [
  {
    name: 'BTC Hourly Sniper',
    scene: 'Short-term BTC setup',
    prompt: 'Trade BTC only. Enter in first 20 minutes each hour. Keep max drawdown under 2%.',
  },
  {
    name: 'ETH Momentum Rider',
    scene: 'Trend continuation',
    prompt: 'Follow ETH momentum with strict stop-loss and partial take-profit rules.',
  },
]
