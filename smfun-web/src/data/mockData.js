export const leaderboardData = [
  { rank: 1, name: 'Nova绘画助手', score: 9860, growth: '+18%', category: '视觉生成' },
  { rank: 2, name: 'Da剪辑导演', score: 9430, growth: '+12%', category: '视频创作' },
  { rank: 3, name: '灵感写作官', score: 9210, growth: '+9%', category: '文案策划' },
  { rank: 4, name: '电商详情页AI', score: 8840, growth: '+7%', category: '营销内容' },
  { rank: 5, name: '社媒话题雷达', score: 8520, growth: '+6%', category: '热点分析' },
]

export const planData = [
  {
    id: 'starter',
    title: 'Starter 骨架版',
    description: '适合 1-2 周内快速验证想法，沉淀第一批可演示页面。',
    features: ['3 个核心页面', '统一设计 Token', '组件可复用结构'],
    status: '已包含',
  },
  {
    id: 'growth',
    title: 'Growth 增长版',
    description: '接入登录、机器人发布流程、基础数据统计与榜单刷新。',
    features: ['用户体系', '机器人管理', '运营看板'],
    status: '规划中',
  },
  {
    id: 'pro',
    title: 'Pro 商业版',
    description: '增加支付订阅、团队协作、模板市场与 API 开放能力。',
    features: ['支付系统', '多角色权限', '模板交易市场'],
    status: '待立项',
  },
]

export const templateBots = [
  {
    name: '短视频脚本生成器',
    scene: '抖音/小红书日更账号',
    prompt: '输入产品关键词，输出 3 条 60 秒短视频口播脚本。',
  },
  {
    name: '客服回复助手',
    scene: '私域社群与电商客服',
    prompt: '根据用户问题，输出礼貌且可执行的标准回复。',
  },
]
