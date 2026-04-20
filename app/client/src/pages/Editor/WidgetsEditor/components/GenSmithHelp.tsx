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

const HELP_SAMPLE_AI_PROMPTS = `# ✦ 推荐：用一句话描述你要的「页面类型」，AI 会输出 Recipe，由 GenSmith 确定性编译成像素级正确的页面

做一个候选人管理页面，表格显示 GetCandidates 的 name 和 email 两列，顶部有刷新和新增按钮，点击新增弹出模态框录入 name、email 并调用 AddCandidate

# 或者：注册表单
做一个用户注册表单，字段用户名、邮箱、密码，点击注册调用 RegisterUser，成功后跳转

# 修改已有组件（会走 Raw DSL 路径 + 自动 sanitize）
把 PageTitle 的文字改为"HR 候选人系统"，颜色改为 #553DE9

# 需要 JS 逻辑（AI 会生成 JS Object 代码，出现在 Generated JS 面板）
为 EmailInput 添加邮箱格式验证，提交时如果格式错误弹出提示

# 迭代调试（有历史记录时使用）
刚才生成的表格里邮箱列的绑定写错了，应该是 item.email 不是 item.emailAddress`;

const HELP_SAMPLE_ENV = `# app/client/.env — 每个提供商各自独立，有 KEY 就会出现在下拉里

REACT_APP_AI_GEMINI_KEY=AIzaSy...
REACT_APP_AI_GEMINI_MODEL=gemini-2.5-flash-preview-04-17   # 可省略

REACT_APP_AI_QWEN_KEY=sk-xxx
REACT_APP_AI_QWEN_MODEL=qwen3-235b-a22b

REACT_APP_AI_DEEPSEEK_KEY=sk-xxx
REACT_APP_AI_DEEPSEEK_MODEL=deepseek-chat

# REACT_APP_AI_OPENAI_KEY=sk-xxx   ← 注释掉则不显示在下拉里`;

const HELP_EXTERNAL_LLM_TEMPLATE = `你是 GenSmith 布局规划师。根据任务性质，你有两种输出模式（二选一，不要混用）：

### 模式 A —— "recipe" 模式（从零生成/整体重建页面时用）
输出一份高级 recipe JSON，由 GenSmith 的确定性编译器生成像素级正确的 Appsmith DSL，你不需要也不应该写 DSL。

### 模式 B —— "patch DSL" 模式（只微调现有页面的某个属性时用）⭐
当用户说"把 X 改成 Y""调整某个按钮的颜色""模态框改成默认不展示"这种 **针对已有页面做小改动** 的请求时，直接输出修改后的**完整 DSL**（不要 recipe），只改动目标属性，其它 widget 一字不动原样复制。

👉 判断标准：prompt 里是否粘贴了"已有页面"/"existing DSL"/"已经有这个页面"？
- 是 → 模式 B（patch DSL）
- 否 → 模式 A（recipe）

========================================================================

## 模式 A —— 输出格式（严格遵守，不要加 markdown 代码块、不要多余解释）

---GENSMITH-RECIPE---
{ ... recipe JSON ... }
---END-RECIPE---

## 模式 B —— 输出格式（直接输出 DSL JSON，不要任何围栏）

{
  "type": "CANVAS_WIDGET",
  "widgetName": "MainContainer",
  ... （原封不动复制 + 修改目标属性）...
}

模式 B 硬性规则：
- 根 CANVAS_WIDGET 必须保留 \`"version": 94\`（如果原始 DSL 有）。没有则加上，否则 deploy 时会被放大 4 倍。
- 除了你要改的属性之外，**一字不动**复制所有原有 widget、字段、顺序、widgetId。
- 不要"顺便优化"任何其它地方。用户只要求改一个点，就只改那一个点。
- DSL 必须是合法 JSON。

## Recipe 类型（选最匹配需求的一种）

### 1) crud-table — 列表+增删改查页面（最常用）
{
  "type": "crud-table",
  "title": "候选人管理",
  "listQuery": "GetCandidates",                  // 必填：表格数据来源
  "refreshQueryAfterMutation": "GetCandidates",  // 可选，默认同 listQuery
  "searchable": true,                             // 可选，默认 true
  "columns": [                                    // 只列出用户真正想看的列
    { "field": "name",  "label": "姓名",  "type": "text"  },
    { "field": "email", "label": "邮箱",  "type": "email" }
  ],
  "createQuery": "AddCandidate",                  // 可选：填了就会生成"+ 新增"按钮和模态框
  "createFields": [                               // 如果 createQuery 填了，必填
    { "name": "name",  "label": "姓名",  "type": "text",  "required": true, "placeholder": "请输入姓名" },
    { "name": "email", "label": "邮箱",  "type": "email", "required": true, "placeholder": "请输入邮箱" }
  ]
}

⚠️ 千万不要把 rowIndex / _id 等系统字段放进 columns。
⚠️ query 名称必须大小写一致，对应当前页面真实存在的 Query。

### 2) form — 独立表单页（注册/登录/提交反馈）
{
  "type": "form",
  "title": "注册",
  "description": "创建你的账号",                  // 可选
  "submitQuery": "RegisterUser",                  // 必填
  "submitLabel": "注册",                          // 可选，默认"提交"
  "onSuccess": "showAlert('注册成功')",           // 可选：提交成功后执行的 JS
  "fields": [
    { "name": "username", "label": "用户名", "type": "text",     "required": true },
    { "name": "password", "label": "密码",   "type": "password", "required": true }
  ]
}

### 3) blank — 空白页（仅当明确要求时）
{ "type": "blank", "title": "我的页面" }

## 字段类型枚举
- 输入框 type：text | email | password | number | textarea | date
- 列 type：text | number | email | date | image

## 小改动速查表（模式 B 专用）
用户的常见诉求 → 需要改的字段：
- **模态框默认不打开 / 关闭自动弹出**：MODAL_WIDGET 的 \`"isVisible": false\`（Appsmith 里 modal 的 isVisible 就是"是否初始打开"，置 false 即可让模态框只由 showModal('<名称>') 触发打开）
- **模态框默认打开**：MODAL_WIDGET \`"isVisible": true\`
- **按钮禁用**：\`"isDisabled": true\` 或 \`"isDisabled": "{{<binding>}}"\`
- **按钮文字 / 颜色 / 主次**：\`text\` / \`buttonColor\` / \`buttonVariant\`(PRIMARY|SECONDARY|TERTIARY)
- **控件隐藏**：非 modal 的 widget 用 \`"isVisible": false\` 即可在部署后不显示（注意 modal 用 isVisible 是"初始打开"而不是"隐藏"）
- **表格列顺序 / 宽度**：\`columnOrder\` 数组、\`primaryColumns.<field>.width\`
- **表格隐藏搜索 / 分页**：\`isVisibleSearch\` / \`isVisiblePagination\`

⚠️ 特别注意：MODAL_WIDGET 的 \`isVisible\` 不是"显示/隐藏"，而是"页面加载时是否自动打开"。这是整个 Appsmith 里最坑的一个属性，一定记住。

## 可选：追加 JS Object 代码
如果需要可复用的 JS 逻辑，append 在 recipe 之后：

---GENSMITH-JS---
// JS Object: Helpers
export default { validate: (e) => /^\\S+@\\S+$/.test(e) }

## 本页已有的 Query（只能用这些，大小写一致）
- GetCandidates   数据源 sheet-frey（Google Sheets），返回 [{name, email, ...}]
- AddCandidate    写入 sheet-frey 一行，入参 name, email

## 本页已有的 JS Object
- （暂无）

## 我要实现（示例——请替换成你自己的需求）

### 示例 1：从零生成（模式 A）
请生成一个候选人管理页面：
- 标题"候选人管理"
- 表格显示 GetCandidates.data，只保留 name（姓名）和 email（邮箱）两列
- 顶部"刷新"和"+ 新增"按钮
- 点击"+ 新增"弹出模态框，录入 name、email，提交调用 AddCandidate 并刷新列表

### 示例 2：对现有页面做小改动（模式 B）
> 把下面这个页面的模态框改成默认不展开（只有点"+ 新增"按钮才弹出）。其它**一字不改**，widgetId、顺序全部保留。
>
> 已有页面如下：
> \`\`\`json
> { ... 这里粘贴你的 DSL ... }
> \`\`\`

（此时 AI 应直接输出修改后的完整 DSL JSON，不要 recipe 围栏；改动点仅为 AddModal 的 \`isVisible: true\` → \`false\`。）`;

const HELP_RECIPE_EXAMPLE = `---GENSMITH-RECIPE---
{
  "type": "crud-table",
  "title": "候选人管理",
  "listQuery": "GetCandidates",
  "refreshQueryAfterMutation": "GetCandidates",
  "columns": [
    { "field": "name",  "label": "姓名",  "type": "text"  },
    { "field": "email", "label": "邮箱",  "type": "email" }
  ],
  "createQuery": "AddCandidate",
  "createFields": [
    { "name": "name",  "label": "姓名",  "type": "text",  "required": true, "placeholder": "请输入姓名" },
    { "name": "email", "label": "邮箱",  "type": "email", "required": true, "placeholder": "请输入邮箱" }
  ]
}
---END-RECIPE---`;

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
              {/* ── Recipe 架构（新） ── */}
              <Section>
                <SectionTitle>
                  ✦ 核心理念：Recipe 驱动（弱模型也能出高质量页面）
                </SectionTitle>
                <Card accent="#553de9">
                  <CardTitle>为什么 Recipe？</CardTitle>
                  <CardDesc>
                    让 LLM 直接写像素级精确的 DSL（64
                    列栅格、模态框独立坐标系、TableV2 primaryColumns
                    结构…）对任何模型都不稳定——弱模型几乎必错，强模型也会偶尔失手。
                    <br />
                    GenSmith 让 AI 只输出一份{" "}
                    <strong>高层语义 JSON（Recipe）</strong>，
                    本地的确定性编译器来生成像素完美、风格统一的 DSL。
                    <br />
                    <br />
                    效果：即便用便宜的小模型，做出来的页面也是产品级一致的排版和样式。
                  </CardDesc>
                </Card>
                <Grid2>
                  <Card accent="#553de9">
                    <CardTitle>支持的 Recipe 类型</CardTitle>
                    <CardDesc>
                      • <code>crud-table</code> — 列表+新增+刷新，90%
                      后台页面需求
                      <br />• <code>form</code> — 独立表单（注册/登录/反馈）
                      <br />• <code>blank</code> — 空白页
                      <br />
                      <br />
                      无法覆盖的复杂场景（自定义图表组合、多 Tab 等）会自动
                      fallback 到 Raw DSL 路径，并由 <strong>
                        Sanitizer
                      </strong>{" "}
                      修复常见错误（按钮过大、 列越界、rowIndex
                      垃圾列、INPUT_WIDGET_V3 等）。
                    </CardDesc>
                  </Card>
                  <Card accent="#553de9">
                    <CardTitle>AI Generate 面板的 Badge</CardTitle>
                    <CardDesc>
                      每次生成后，在下拉右侧会显示一个标签：
                      <br />• <strong>✦ Recipe · crud-table</strong> —
                      走的编译器路径（理想）
                      <br />• <strong>⚠ Raw DSL</strong> — LLM 没有用
                      Recipe，走的 sanitizer 路径
                      <br />
                      <br />
                      如果老是出现 ⚠ Raw DSL，说明你的 prompt
                      过于特殊或模型忽视了系统提示，
                      可以换个说法或切换到更强的模型。
                    </CardDesc>
                  </Card>
                </Grid2>
                <Card accent="#553de9">
                  <CardTitle>Recipe 示例（AI 输出的就是这种）</CardTitle>
                  <CopyableCodeBlock text={HELP_RECIPE_EXAMPLE} />
                </Card>
              </Section>

              {/* ── Apply Code → Deploy 正确节奏 ── */}
              <Section>
                <SectionTitle>
                  💾 Apply Code → Deploy 的正确节奏（重要！）
                </SectionTitle>
                <Card accent="#f59e0b">
                  <CardTitle>为什么我 Deploy 后看到的还是旧页面？</CardTitle>
                  <CardDesc>
                    点击 <strong>AI Generate</strong> 或{" "}
                    <strong>Apply Code</strong> 之后， GenSmith 会把新 DSL 写入
                    Redux（预览立刻刷新）， 但真正落库到服务端有一个小延迟（约
                    500ms – 1s）。
                    <br />
                    <br />
                    如果你在这个窗口期里就点了 <strong>Deploy</strong>
                    ，服务端发布的依然是
                    <strong>旧的已保存版本</strong>。
                    <br />
                    <br />
                    解决：看 GenSmith 顶部工具栏的 <strong>状态胶囊</strong>：
                    <br />• 🟡 <code>Saving…</code> — 正在保存，
                    <strong>请不要点 Deploy</strong>
                    <br />• 🟢 <code>Saved · 可以 Deploy</code> — 已落库，随便点
                    <br />• 🔴 <code>Save failed</code> — 重新点一次 Apply Code
                  </CardDesc>
                </Card>
              </Section>

              {/* ── DSL 版本号 ── */}
              <Section>
                <SectionTitle>
                  🧬 如果你看到 “Deploy 之后页面突然放大 4 倍”
                </SectionTitle>
                <Card accent="#dc2626">
                  <CardTitle>
                    根因：DSL 缺 version → 触发 v19 栅格迁移
                  </CardTitle>
                  <CardDesc>
                    Appsmith 对没有 <code>version</code> 字段的 DSL
                    会把它当成远古版本， 运行一串历史迁移脚本，其中第 19 步（
                    <code>migrateToNewLayout</code>） 会把
                    <strong>所有组件的列/行坐标乘以 4</strong>——于是表格宽度变成
                    4 倍、按钮变成 4 倍，页面跑到 5000px 宽。
                    <br />
                    <br />
                    解决：GenSmith 现在自动在 MainContainer 根节点写
                    <code>{`"version": 94`}</code>（
                    <code>LATEST_DSL_VERSION</code>），
                    迁移器就会跳过这串脚本。Recipe 路径和 Raw DSL
                    兜底路径都已经修好了， 你应该再也看不到这个问题。
                    <br />
                    <br />
                    如果你是手写 raw DSL：<strong>一定要</strong>带
                    <code>{`"version": 94`}</code> 在最外层的{" "}
                    <code>MainContainer</code> 上。
                  </CardDesc>
                </Card>
              </Section>

              {/* ── 预览区中的模态框 ── */}
              <Section>
                <SectionTitle>
                  🪟 GenSmith 预览里模态框好像不居中？
                </SectionTitle>
                <Card accent="#2563eb">
                  <CardTitle>这是预览窗口的限制，不是 DSL 有问题</CardTitle>
                  <CardDesc>
                    GenSmith 打开的时候，页面的一半被 JSON 编辑器占掉了，
                    右边只剩下真实应用的一半宽度来做预览。 但 Appsmith 的{" "}
                    <strong>ModalWidget</strong> 总是以
                    <strong>整个浏览器窗口为坐标系</strong>居中（position:
                    fixed）， 所以你会看到它只展示在预览区的一半，另一半“溢出”到
                    JSON 编辑器那边。
                    <br />
                    <br />
                    验证方法：
                    <br />
                    1) 先等 🟢 <code>Saved · 可以 Deploy</code>
                    <br />
                    2) 关闭 GenSmith 面板（右上角 ✕ Exit）
                    <br />
                    3) 或直接打开 Deploy 后的 Preview
                    <br />→ 模态框就会相对真实应用居中，没有问题。
                  </CardDesc>
                </Card>
              </Section>

              {/* ── 模态框默认关闭 + 外部 AI 微调 ── */}
              <Section>
                <SectionTitle>
                  🔔 模态框自动弹出 & 如何用外部 AI 做小改动
                </SectionTitle>
                <Grid2>
                  <Card accent="#be185d">
                    <CardTitle>
                      ⚠ Appsmith 陷阱：MODAL 的 isVisible 是“初始打开”
                    </CardTitle>
                    <CardDesc>
                      和其它 widget 不同，
                      <strong>MODAL_WIDGET 的 isVisible</strong>
                      不是“显示/隐藏”，而是
                      <strong>页面加载时是否自动弹开</strong>。 置{" "}
                      <code>true</code> 会导致每次进页面模态框都“啪”地弹出来。
                      <br />
                      <br />
                      GenSmith 现在会自动把生成的模态框设为{" "}
                      <code>isVisible: false</code>，由“+ 新增”按钮的
                      <code>{`showModal('AddModal')`}</code> 来打开。从外部 AI
                      粘贴进来的 DSL 也会被自动修正。
                    </CardDesc>
                  </Card>
                  <Card accent="#0f766e">
                    <CardTitle>🪄 外部 AI 小改动的正确用法</CardTitle>
                    <CardDesc>
                      外部 AI 默认会<strong>重新生成整个 recipe</strong>
                      ——当你想做一个微调（比如“把模态框改成默认不展开”）时，
                      它会回给你一整段和原来一样的 recipe，看上去什么都没变。
                      <br />
                      <br />
                      正确姿势：在“我要实现”后面把
                      <strong>当前 DSL JSON 粘贴进去</strong>
                      （整段复制 GenSmith 左边 JSON 编辑器的内容），并明确写
                      “只改 X，其余一字不动”。提示模板已经更新了， AI
                      会自动切到“patch DSL”模式，输出修改后的完整 DSL，
                      你直接复制回 GenSmith → Apply Code 就行。
                    </CardDesc>
                  </Card>
                </Grid2>
              </Section>

              {/* ── 拖拽与两种编辑模式 ── */}
              <Section>
                <SectionTitle>🖱 什么时候可以用鼠标拖拽调整？</SectionTitle>
                <Grid2>
                  <Card accent="#047857">
                    <CardTitle>✅ GenSmith 关闭后：自由拖拽</CardTitle>
                    <CardDesc>
                      关闭 GenSmith 面板（右上角 ✕ Exit）回到标准 Appsmith
                      编辑器， 这时所有组件都可以自由拖拽缩放调位置。
                      <br />
                      <br />
                      推荐流程：
                      <br />
                      1) 用 GenSmith 让 AI 快速生成骨架
                      <br />
                      2) 等 <code>Saved</code> 胶囊出现
                      <br />
                      3) Exit GenSmith
                      <br />
                      4) 在正常画布里拖拽微调（可选）
                      <br />
                      5) Deploy
                    </CardDesc>
                  </Card>
                  <Card accent="#b45309">
                    <CardTitle>⚠ GenSmith 开启中：JSON 是源</CardTitle>
                    <CardDesc>
                      GenSmith 打开的时候，左边的 JSON 编辑器是
                      <strong>唯一真实源</strong>。 你在右边预览区尝试拖拽会被
                      300ms 内的同步覆盖，看起来像“回弹”。
                      <br />
                      <br />在 GenSmith 里要改尺寸，请直接改 JSON（
                      <code>leftColumn</code>/<code>rightColumn</code>/
                      <code>topRow</code>/<code>bottomRow</code>） 或让 AI
                      重新生成。这是故意的设计——避免两边打架。
                    </CardDesc>
                  </Card>
                </Grid2>
              </Section>

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
