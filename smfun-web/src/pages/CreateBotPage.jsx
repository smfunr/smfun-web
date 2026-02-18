import { templateBots } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

export function CreateBotPage() {
  return (
    <div className="page-stack">
      <section className="card">
        <Tag>创建 AI 机器人</Tag>
        <SectionHeader
          title="三步创建你的 AI 机器人"
          desc="当前为可运行骨架，提交行为可替换为接口调用"
        />

        <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
          <label>
            机器人名称
            <input placeholder="例如：店铺爆款标题助手" />
          </label>
          <label>
            目标用户
            <input placeholder="例如：电商运营、新媒体编辑" />
          </label>
          <label>
            业务场景
            <select defaultValue="">
              <option value="" disabled>
                请选择场景
              </option>
              <option>内容创作</option>
              <option>营销增长</option>
              <option>客服自动化</option>
              <option>数据分析</option>
            </select>
          </label>
          <label>
            Prompt 模板
            <textarea rows="5" placeholder="输入你的提示词结构..." />
          </label>
          <button className="btn btn--primary" type="submit">
            保存草稿（占位）
          </button>
        </form>
      </section>

      <section>
        <SectionHeader title="快速模板" desc="可复用组件：卡片列表 + 场景描述 + 一键套用" />
        <div className="grid grid--2">
          {templateBots.map((item) => (
            <article key={item.name} className="card">
              <h3>{item.name}</h3>
              <p className="label">适用场景：{item.scene}</p>
              <p>{item.prompt}</p>
              <button className="btn btn--ghost">套用模板</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
