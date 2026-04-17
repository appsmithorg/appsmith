import React, { useCallback, useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Button } from "@appsmith/ads";

// ---------------------------------------------------------------------------
// Animations & layout
// ---------------------------------------------------------------------------

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
`;

const selectableText = `
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
`;

const Panel = styled.div`
  position: relative;
  z-index: 1;
  background: var(--ads-v2-color-bg);
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 760px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.18s ease;
  overflow: hidden;
  outline: none;
  ${selectableText}
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  flex-shrink: 0;
  background: linear-gradient(135deg, #553de9 0%, #7c5cfc 100%);
  ${selectableText}
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  ${selectableText}
`;

const PanelBody = styled.div`
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  ${selectableText}
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${selectableText}
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  ${selectableText}
`;

const Card = styled.div<{ accent?: string }>`
  border: 1px solid var(--ads-v2-color-border);
  border-left: 4px solid
    ${({ accent }) => accent ?? "var(--ads-v2-color-border)"};
  border-radius: 6px;
  padding: 12px 14px;
  background: var(--ads-v2-color-bg-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
  ${selectableText}
`;

const CardTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--ads-v2-color-fg);
  display: flex;
  align-items: center;
  gap: 6px;
  ${selectableText}
`;

const CardDesc = styled.div`
  font-size: 12px;
  color: var(--ads-v2-color-fg-muted);
  line-height: 1.6;
  ${selectableText}
`;

const CodeBlockToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
`;

const CopyMiniBtn = styled.button`
  border: 1px solid rgba(205, 214, 244, 0.35);
  background: rgba(30, 30, 46, 0.95);
  color: #cba6f7;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;

  &:hover {
    background: rgba(49, 50, 68, 0.98);
  }
`;

const CodeBlock = styled.pre`
  margin: 0;
  padding: 8px 10px;
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 0 0 5px 5px;
  font-size: 11px;
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: text;
  ${selectableText}
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  ${selectableText}

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FlowRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--ads-v2-color-fg-muted);
`;

const Arrow = styled.span`
  font-size: 14px;
  color: #553de9;
  font-weight: 700;
`;

const Tag = styled.span<{ type: "manual" | "code" | "ai" }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ type }) =>
    type === "manual" ? "#fef3c7" : type === "code" ? "#dbeafe" : "#ede9fe"};
  color: ${({ type }) =>
    type === "manual" ? "#92400e" : type === "code" ? "#1e40af" : "#5b21b6"};
  ${selectableText}
`;

// ---------------------------------------------------------------------------
// Help Button (exported standalone)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Copyable prompt templates (single source of truth for display + copy)
// ---------------------------------------------------------------------------

const HELP_SAMPLE_AI_PROMPTS = `# 新增组件（AI 会自动知道已有哪些 Query）
新增一个数据表格，绑定到 GetCandidates 的返回数据，显示 name 和 email 两列

# 修改已有组件
把 PageTitle 的文字改为"HR 候选人系统"，颜色改为 #553DE9

# 需要 JS 逻辑（AI 会生成 JS Object 代码，出现在 Generated JS 面板）
为 EmailInput 添加邮箱格式验证，提交时如果格式错误弹出提示

# 迭代调试（有历史记录时使用）
刚才生成的表格，邮箱列的绑定写错了，应该是 item.email 不是 item.emailAddress`;

const HELP_SAMPLE_ENV = `# app/client/.env — 每个提供商各自独立，有 KEY 就会出现在下拉里

REACT_APP_AI_GEMINI_KEY=AIzaSy...
REACT_APP_AI_GEMINI_MODEL=gemini-2.5-flash-preview-04-17   # 可省略

REACT_APP_AI_QWEN_KEY=sk-xxx
REACT_APP_AI_QWEN_MODEL=qwen3-235b-a22b

REACT_APP_AI_DEEPSEEK_KEY=sk-xxx
REACT_APP_AI_DEEPSEEK_MODEL=deepseek-chat

# REACT_APP_AI_OPENAI_KEY=sk-xxx   ← 注释掉则不显示在下拉里`;

const HELP_EXTERNAL_LLM_TEMPLATE = `你是 Appsmith DSL 专家。请根据我的需求生成一个合法的嵌套 JSON DSL，直接输出原始 JSON，不要 markdown 代码块，不要任何解释文字。

## DSL 格式规范
- 根节点必须是 { "type": "CANVAS_WIDGET", "widgetId": "0", "widgetName": "MainContainer", "children": [...] }
- 每个 Widget 必须包含字段：widgetId（8位随机字母数字）、type、widgetName（PascalCase）、
  topRow、bottomRow、leftColumn、rightColumn
- 画布宽度为 64 列，行高约 10px，建议每行组件高度 4~6 行（即 bottomRow - topRow = 4~6）
- 常用 Widget 类型：
    TEXT_WIDGET          – 文本标签
    INPUT_WIDGET_V2      – 输入框（属性 inputType: "TEXT"/"EMAIL"/"NUMBER"；勿用 INPUT_WIDGET_V3，本构建未注册）
    BUTTON_WIDGET        – 按钮（属性 text、buttonColor、onClick）
    TABLE_WIDGET_V2      – 表格（属性 tableData、primaryColumns）
    SELECT_WIDGET        – 下拉选择框
    FORM_WIDGET          – 表单容器
- 动态绑定语法：{{ QueryName.data }}、{{ WidgetName.text }}、{{ JSObjectName.method() }}
- 按钮颜色推荐使用 Appsmith 主色 #553DE9

## DSL 示例（参考格式，不要照抄）
{
  "type": "CANVAS_WIDGET",
  "widgetId": "0",
  "widgetName": "MainContainer",
  "topRow": 0, "bottomRow": 100, "leftColumn": 0, "rightColumn": 64,
  "children": [
    {
      "type": "TEXT_WIDGET",
      "widgetId": "txt00001",
      "widgetName": "PageTitle",
      "text": "候选人管理",
      "fontSize": "HEADING1",
      "topRow": 0, "bottomRow": 4, "leftColumn": 0, "rightColumn": 32
    },
    {
      "type": "TABLE_WIDGET_V2",
      "widgetId": "tbl00001",
      "widgetName": "CandidateTable",
      "tableData": "{{ GetCandidates.data }}",
      "primaryColumns": {
        "name":  { "columnType": "text", "label": "姓名",  "alias": "name" },
        "email": { "columnType": "text", "label": "邮箱", "alias": "email" }
      },
      "topRow": 5, "bottomRow": 35, "leftColumn": 0, "rightColumn": 64
    }
  ]
}

## 本页面已有的 Query（可直接绑定）
# 请将实际 Query 名称和数据源替换到下面：
- GetCandidates   数据源: sheet-frey（Google Sheets），返回行数组
- AddCandidate    数据源: sheet-frey，写入一行

## 本页面已有的 JS Object（可直接调用）
# 如果没有 JS Object，删除这一节；如有，填入名称和方法：
- （暂无）

## 我的功能需求
# 在这里描述你要实现的 UI：
请生成一个候选人管理页面，包含：
1. 顶部标题"候选人管理"
2. 一个显示所有候选人的表格（绑定 GetCandidates.data），列：姓名、邮箱
3. 表格下方一个表单，含姓名输入框和邮箱输入框
4. 表单底部一个"提交"按钮，点击后执行 AddCandidate.run() 并刷新 GetCandidates.run()`;

function CopyableCodeBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <>
      <CodeBlockToolbar>
        <CopyMiniBtn onClick={handleCopy} type="button">
          {copied ? "✓ 已复制" : "复制全文"}
        </CopyMiniBtn>
      </CodeBlockToolbar>
      <CodeBlock>{text}</CodeBlock>
    </>
  );
}

const HelpBtn = styled.button`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--ads-v2-color-border-emphasis);
  background: transparent;
  color: var(--ads-v2-color-fg-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
    color: var(--ads-v2-color-fg);
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GenSmithHelp() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(
    function focusGenSmithHelpPanel() {
      if (open) {
        panelRef.current?.focus({ preventScroll: true });
      }
    },
    [open],
  );

  return (
    <>
      <HelpBtn
        onClick={() => setOpen(true)}
        title="GenSmith 使用说明"
        type="button"
      >
        ?
      </HelpBtn>

      {open && (
        <Overlay>
          <Backdrop
            onClick={() => {
              if (window.getSelection()?.toString()) return;

              setOpen(false);
            }}
          />
          <Panel
            aria-labelledby="gensmith-help-title"
            aria-modal="true"
            ref={panelRef}
            role="dialog"
            tabIndex={-1}
          >
            <PanelHeader>
              <PanelTitle id="gensmith-help-title">
                <span>✦</span> GenSmith 使用说明
              </PanelTitle>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: "2px 8px",
                }}
              >
                ✕
              </button>
            </PanelHeader>

            <PanelBody>
              {/* ── 整体分工 ── */}
              <Section>
                <SectionTitle>
                  📋 整体分工：什么需要手动，什么可以用 GenSmith
                </SectionTitle>
                <Grid2>
                  <Card accent="#f59e0b">
                    <CardTitle>
                      <Tag type="manual">✋ 手动</Tag> 数据源（Datasource）
                    </CardTitle>
                    <CardDesc>
                      必须在 Appsmith 左侧边栏 → Datasources → + New
                      手动创建并认证。
                      <br />
                      例：MySQL、Google Sheets、REST API。
                      <br />
                      <strong>GenSmith 无法替你创建或修改数据源。</strong>
                    </CardDesc>
                  </Card>
                  <Card accent="#f59e0b">
                    <CardTitle>
                      <Tag type="manual">✋ 手动</Tag> 查询（Query / API）
                    </CardTitle>
                    <CardDesc>
                      在编辑器左侧 Queries → + New 手动创建。
                      <br />
                      每个 Query 绑定一个数据源，定义 SQL / HTTP 请求参数。
                      <br />
                      Query 名称（如 <code>GetCandidates</code>）可以在 DSL
                      里引用。
                    </CardDesc>
                  </Card>
                  <Card accent="#3b82f6">
                    <CardTitle>
                      <Tag type="code">{"</>"} Code 模式</Tag> 页面 UI（Widget
                      DSL）
                    </CardTitle>
                    <CardDesc>
                      GenSmith 的核心能力：用 JSON
                      或自然语言创建、修改页面上的所有组件（文本、表格、按钮、输入框…）。
                      <br />
                      只影响当前页面的 Widget 层，不影响 Query 和数据源。
                    </CardDesc>
                  </Card>
                  <Card accent="#8b5cf6">
                    <CardTitle>
                      <Tag type="ai">✦ AI 模式</Tag> 自然语言生成 UI + JS
                    </CardTitle>
                    <CardDesc>
                      在 AI Generate 输入框里描述需求，AI 自动生成 DSL
                      并同步到画布。
                      <br />
                      如果需要 JS 逻辑，AI 同时生成 JS Object 代码（出现在
                      Generated JS 面板，点 Copy 后手动创建）。
                      <br />
                      支持：Gemini / 通义千问 / DeepSeek / OpenAI。
                    </CardDesc>
                  </Card>
                </Grid2>
              </Section>

              {/* ── 典型工作流 ── */}
              <Section>
                <SectionTitle>🔄 典型工作流（以候选人管理为例）</SectionTitle>
                <Card accent="#553de9">
                  <FlowRow>
                    <Tag type="manual">✋ 手动</Tag>
                    创建数据源 sheet-frey
                    <Arrow>→</Arrow>
                    <Tag type="manual">✋ 手动</Tag>
                    创建 Query GetCandidates、AddCandidate
                    <Arrow>→</Arrow>
                    <Tag type="code">{"</>"} Code</Tag>点 GenSmith 按钮，粘贴
                    DSL 或用 AI 生成 UI
                    <Arrow>→</Arrow>
                    <Tag type="manual">✋ 手动</Tag>
                    在属性面板微调样式（可选）
                  </FlowRow>
                </Card>
                <CardDesc style={{ padding: "0 4px" }}>
                  JS Object（页面逻辑）同样需要手动创建（左侧 JS → + New），
                  或者在按钮 onClick 等属性里直接写{" "}
                  <code>
                    {"{{"}Query.run(){"}}"}
                  </code>{" "}
                  绑定表达式。
                </CardDesc>
              </Section>

              {/* ── Code 模式操作 ── */}
              <Section>
                <SectionTitle>{"</>"} Code 模式操作说明</SectionTitle>
                <Grid2>
                  <Card accent="#3b82f6">
                    <CardTitle>Code → UI（推送）</CardTitle>
                    <CardDesc>
                      在 Monaco 编辑器里修改 JSON，点{" "}
                      <strong>Apply Code</strong> 立即同步到画布。
                      <br />
                      或等待 300ms 自动同步（防抖）。
                    </CardDesc>
                  </Card>
                  <Card accent="#3b82f6">
                    <CardTitle>UI → Code（拉取）</CardTitle>
                    <CardDesc>
                      在右侧画布拖拽组件或修改属性后，左侧 JSON 约 300ms
                      内自动更新。
                    </CardDesc>
                  </Card>
                  <Card accent="#3b82f6">
                    <CardTitle>Format 按钮</CardTitle>
                    <CardDesc>格式化当前 JSON，同时触发 Apply。</CardDesc>
                  </Card>
                  <Card accent="#ef4444">
                    <CardTitle>错误提示</CardTitle>
                    <CardDesc>
                      JSON
                      非法时编辑器下方显示红色报错，画布保持不变，不会白屏。
                    </CardDesc>
                  </Card>
                </Grid2>
              </Section>

              {/* ── AI 模式 ── */}
              <Section>
                <SectionTitle>✦ AI 模式操作说明</SectionTitle>
                <Card accent="#8b5cf6">
                  <CardTitle>使用步骤</CardTitle>
                  <CardDesc>
                    1. 在 <code>app/client/.env</code> 配置好 API Key 并重启
                    yarn start（只需一次）
                    <br />
                    2. 打开 GenSmith → 在 <strong>AI Generate</strong>{" "}
                    右侧下拉切换想用的模型
                    <br />
                    3. 在输入框填写需求，点击 <strong>AI Generate ⌘↵</strong>
                    ，等待约 5-15 秒
                    <br />
                    4. AI 生成的 DSL 自动合并到画布；需要 JS 逻辑时，下方出现{" "}
                    <strong>Generated JS</strong> 面板
                  </CardDesc>
                </Card>
                <Grid2>
                  <Card accent="#8b5cf6">
                    <CardTitle>🔄 对话历史（迭代调试）</CardTitle>
                    <CardDesc>
                      每次 AI Generate 都会将本次对话记录在内存中。 后续请求时
                      AI
                      能看到之前生成了什么、之前的问题是什么，可以做增量修改和
                      bug 修复。
                      <br />
                      面板顶部的 <strong>🕓 N turns</strong>{" "}
                      标签显示历史轮数，点击可清除（开启新话题时建议清除）。
                    </CardDesc>
                  </Card>
                  <Card accent="#8b5cf6">
                    <CardTitle>📋 Extra Context（可选）</CardTitle>
                    <CardDesc>
                      点 <strong>▸ Extra context</strong> 展开文本框，粘贴 Query
                      返回结构或业务规则。 AI 会用这些信息生成更准确的数据绑定。
                      <br />
                      例：
                      <code>
                        GetCandidates returns [{"{"}name,email{"}"}]
                      </code>
                    </CardDesc>
                  </Card>
                </Grid2>
                <Card accent="#8b5cf6">
                  <CardTitle>🤖 自动注入的 Page Context（零配置）</CardTitle>
                  <CardDesc>
                    每次 AI Generate 都会自动把当前页面的{" "}
                    <strong>所有 Query 名称 + SQL/配置</strong> 和
                    <strong>所有 JS Object 代码</strong> 注入进 Prompt 里。
                    <br />
                    这意味着：
                    <br />• AI 总是知道有哪些 Query 可以引用（如{" "}
                    <code>{"{{GetCandidates.data}}"}</code>）
                    <br />
                    • 如果你已经创建了 JS Object，AI
                    能看到它的代码，可以修改或扩展
                    <br />• 你修改一个 Widget 属性后，再次 Generate，AI
                    看到的是最新状态——无需手动描述当前状态
                  </CardDesc>
                </Card>
                <Card accent="#8b5cf6">
                  <CardTitle>示例 Prompt</CardTitle>
                  <CopyableCodeBlock text={HELP_SAMPLE_AI_PROMPTS} />
                </Card>
              </Section>

              {/* ── AI 提供商切换 ── */}
              <Section>
                <SectionTitle>🔑 AI 提供商：配置与切换</SectionTitle>
                <Card accent="#10b981">
                  <CardTitle>所有提供商可同时配置，页面内随时切换</CardTitle>
                  <CardDesc>
                    在 <code>app/client/.env</code> 里填入各提供商的 KEY，重启
                    yarn start 后，
                    <strong> AI Generate 面板左侧会出现下拉菜单</strong>
                    ，直接切换无需再次重启。
                  </CardDesc>
                  <CopyableCodeBlock text={HELP_SAMPLE_ENV} />
                </Card>
                <Grid2>
                  <Card accent="#10b981">
                    <CardTitle>各提供商 API Key 获取</CardTitle>
                    <CardDesc>
                      • <strong>Gemini</strong>：aistudio.google.com → Get API
                      Key（AIza…）
                      <br />• <strong>通义千问</strong>：dashscope.aliyuncs.com
                      → API Key（sk-…）
                      <br />• <strong>DeepSeek</strong>：platform.deepseek.com →
                      API Keys
                      <br />• <strong>OpenAI</strong>：platform.openai.com → API
                      Keys
                    </CardDesc>
                  </Card>
                  <Card accent="#f59e0b">
                    <CardTitle>⚠️ CORS 注意</CardTitle>
                    <CardDesc>
                      部分提供商不允许浏览器直接调用（会报 CORS 错误）。
                      <br />
                      • Gemini：✅ 支持浏览器直连
                      <br />
                      • 通义千问：✅ 支持（DashScope 允许）
                      <br />
                      • DeepSeek：⚠️ 可能需要后端代理
                      <br />• OpenAI：⚠️ 官方 API 不支持浏览器直连
                    </CardDesc>
                  </Card>
                </Grid2>
              </Section>

              {/* ── 外部 LLM Prompt 模板 ── */}
              <Section>
                <SectionTitle>
                  📋 在外部模型（GPT / Gemini 网页版）生成代码
                </SectionTitle>
                <Card accent="#0ea5e9">
                  <CardTitle>使用流程</CardTitle>
                  <CardDesc>
                    1. 点代码块右上角的 <strong>复制全文</strong>
                    ，或先在本弹窗内点一下再拖选文字（避免 Cmd+C 仍复制背后
                    Monaco 里的内容）
                    <br />
                    2. 在 ChatGPT / Gemini / Claude
                    等网页粘贴，填入你的查询信息和功能需求
                    <br />
                    3. 把外部模型返回的 JSON 粘贴到 GenSmith Monaco 编辑器
                    <br />
                    4. 点 <strong>Apply Code</strong>，画布立即渲染
                  </CardDesc>
                </Card>
                <Card accent="#0ea5e9">
                  <CardTitle>完整 Prompt 模板（复制修改后使用）</CardTitle>
                  <CopyableCodeBlock text={HELP_EXTERNAL_LLM_TEMPLATE} />
                </Card>
                <Card accent="#0ea5e9">
                  <CardTitle>小技巧</CardTitle>
                  <CardDesc>
                    • 如果外部模型返回的 JSON
                    有错误，粘贴后编辑器底部会显示红色报错，不会让画布崩溃
                    <br />• 点 <strong>Format</strong> 可以一键格式化 +
                    应用，方便检查结构
                    <br />
                    • 先用外部模型生成大框架，再用 GenSmith 内置 AI Generate
                    做精细修改，效率最高
                    <br />• widgetId 只要在当前 DSL 里唯一即可，8
                    位随机字母数字（如 <code>abc12345</code>）
                  </CardDesc>
                </Card>
              </Section>

              {/* ── 能力边界 ── */}
              <Section>
                <SectionTitle>🚧 当前能力边界</SectionTitle>
                <Card accent="#ef4444">
                  <CardDesc>
                    <strong>GenSmith 只控制 Widget（UI 层）</strong>
                    ，以下内容不在 Code/AI 模式的自动管理范围内：
                    <br />
                    • 数据源的连接凭证（需要手动配置）
                    <br />
                    • Query 的 SQL / HTTP 参数（需要手动写，AI 可引用已有
                    Query）
                    <br />
                    • JS Object 实体创建（手动：左侧 JS → + New，但 AI
                    会生成代码供你粘贴）
                    <br />• 页面路由、应用级设置、Theme 主题
                  </CardDesc>
                </Card>
              </Section>
            </PanelBody>

            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--ads-v2-color-border)",
                display: "flex",
                justifyContent: "flex-end",
                flexShrink: 0,
              }}
            >
              <Button kind="primary" onClick={() => setOpen(false)} size="sm">
                知道了
              </Button>
            </div>
          </Panel>
        </Overlay>
      )}
    </>
  );
}
