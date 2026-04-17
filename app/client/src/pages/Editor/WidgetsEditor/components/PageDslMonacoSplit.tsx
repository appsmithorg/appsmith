import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
} from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { debounce } from "lodash";

// No-op inline worker: avoids all CDN / publicPath worker-loading issues.
window.MonacoEnvironment = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getWorker(_moduleId: string, _label: string) {
    return new Worker(
      URL.createObjectURL(new Blob([""], { type: "application/javascript" })),
    );
  },
};

loader.config({ monaco });

import { Button, Text } from "@appsmith/ads";
import { flattenDSL, nestDSL, ROOT_CONTAINER_WIDGET_ID } from "@shared/dsl";
import type { FlattenedDSL, NestedDSL } from "@shared/dsl";
import { updateAndSaveLayout } from "actions/pageActions";
import { getCanvasWidgets } from "ee/selectors/entitiesSelector";
import { getActions, getJSCollections } from "ee/selectors/entitiesSelector";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { DefaultRootState } from "react-redux";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  generateAndApplyDsl,
  validateNestedDsl,
  buildPageContext,
} from "utils/generateDSLFromPrompt";
import { getAvailableProviders, PROVIDER_LABELS } from "utils/aiService";
import type { AiProvider, ConversationTurn } from "utils/aiService";
import { GenSmithHelp } from "./GenSmithHelp";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY_TURNS = 8;

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const SplitRoot = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
`;

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 42%;
  min-width: 280px;
  max-width: 55%;
  border-right: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg);
  min-height: 0;
`;

const EditorToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

const AiPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  flex-shrink: 0;
  border-bottom: 2px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg-subtle);
`;

const AiPanelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AiLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ads-v2-color-fg-muted);
  text-transform: uppercase;
  flex: 1;
`;

const ProviderSelect = styled.select`
  height: 24px;
  padding: 0 20px 0 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 4px;
  background: var(--ads-v2-color-bg);
  color: #553de9;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23553de9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  flex-shrink: 0;

  &:focus {
    outline: none;
    border-color: #553de9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HistoryChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 20px;
  border: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg);
  font-size: 10px;
  font-weight: 600;
  color: var(--ads-v2-color-fg-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.1s;

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
    color: var(--ads-v2-color-fg);
  }
`;

const PromptTextarea = styled.textarea`
  flex: 1;
  resize: none;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: inherit;
  line-height: 1.5;
  background: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  min-height: 54px;
  max-height: 120px;
  overflow-y: auto;

  &:focus {
    outline: none;
    border-color: var(--ads-v2-color-border-emphasis);
  }

  &::placeholder {
    color: var(--ads-v2-color-fg-subtle);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ContextToggle = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  color: var(--ads-v2-color-fg-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;

  &:hover {
    color: var(--ads-v2-color-fg);
  }
`;

const ContextTextarea = styled.textarea`
  width: 100%;
  resize: vertical;
  border: 1px dashed var(--ads-v2-color-border);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 11px;
  font-family: monospace;
  line-height: 1.5;
  background: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  min-height: 48px;
  max-height: 140px;
  overflow-y: auto;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--ads-v2-color-border-emphasis);
  }

  &::placeholder {
    color: var(--ads-v2-color-fg-subtle);
    font-style: italic;
  }
`;

const JsPanel = styled.div`
  flex-shrink: 0;
  border-top: 2px solid #553de9;
  background: #1e1e2e;
  display: flex;
  flex-direction: column;
  max-height: 220px;
`;

const JsPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  flex-shrink: 0;
`;

const JsPanelTitle = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #cba6f7;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const JsCode = styled.pre`
  flex: 1;
  margin: 0;
  padding: 8px 12px;
  font-size: 11px;
  line-height: 1.55;
  color: #cdd6f4;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  overflow: auto;
  white-space: pre;
`;

const CopyBtn = styled.button`
  background: rgba(203, 166, 247, 0.15);
  border: 1px solid rgba(203, 166, 247, 0.3);
  border-radius: 4px;
  color: #cba6f7;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  cursor: pointer;
  transition: background 0.1s;

  &:hover {
    background: rgba(203, 166, 247, 0.25);
  }
`;

const ErrorBanner = styled.div`
  padding: 6px 10px;
  background: var(--ads-v2-color-bg-error);
  border-left: 3px solid var(--ads-v2-color-fg-error);
  flex-shrink: 0;
`;

const EditorSurface = styled.div`
  flex: 1;
  min-height: 0;
`;

const PreviewColumn = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const PreviewChrome = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  & [id^="div-dragarena-"],
  & [id^="div-selection-"] {
    display: none !important;
  }

  & canvas[id^="canvas-dragging-"],
  & canvas[id^="canvas-selection-"] {
    display: none !important;
  }

  & .t--multi-selection-box {
    display: none !important;
  }
`;

// ---------------------------------------------------------------------------
// Error boundary
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  error: Error | null;
}

class EditorErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[GenSmith] Editor error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorBanner>
          <Text color="var(--ads-v2-color-fg-error)" kind="body-s">
            <strong>Editor error:</strong> {this.state.error.message}
          </Text>
          <Button
            kind="secondary"
            onClick={() => this.setState({ error: null })}
            size="sm"
            style={{ marginTop: 4 }}
          >
            Dismiss
          </Button>
        </ErrorBanner>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializePageDsl(widgets: CanvasWidgetsReduxState): string {
  const nested = nestDSL(
    widgets as FlattenedDSL<WidgetProps>,
    ROOT_CONTAINER_WIDGET_ID,
  );

  return JSON.stringify(nested, null, 2);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PageDslMonacoSplitProps {
  children: ReactNode;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PageDslMonacoSplit(props: PageDslMonacoSplitProps) {
  const dispatch = useDispatch();

  // ── Provider selection ──────────────────────────────────────────────────
  const availableProviders = useMemo(() => getAvailableProviders(), []);

  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(() => {
    const saved = localStorage.getItem(
      "gensmith_provider",
    ) as AiProvider | null;

    if (saved && availableProviders.includes(saved)) return saved;

    return availableProviders[0] ?? "gemini";
  });

  const handleProviderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const p = e.target.value as AiProvider;

      setSelectedProvider(p);
      localStorage.setItem("gensmith_provider", p);
    },
    [],
  );

  // ── Page context: auto-inject queries + JS Objects from Redux ────────────
  const allActions = useSelector(getActions);
  const allJsCollections = useSelector(getJSCollections);
  const currentPageId = useSelector(getCurrentPageId);

  const pageContext = useMemo(
    () => buildPageContext(allActions, allJsCollections, currentPageId ?? ""),
    [allActions, allJsCollections, currentPageId],
  );

  // ── Extra context (user-provided, collapsible) ───────────────────────────
  const [showExtraContext, setShowExtraContext] = useState(false);
  const [extraContext, setExtraContext] = useState("");

  // ── Conversation history ─────────────────────────────────────────────────
  const [history, setHistory] = useState<ConversationTurn[]>([]);

  const addTurn = useCallback(
    (userMessage: string, assistantMessage: string, label: string) => {
      setHistory((prev) => {
        const next: ConversationTurn[] = [
          ...prev,
          { userMessage, assistantMessage, label, timestamp: Date.now() },
        ];

        return next.slice(-MAX_HISTORY_TURNS);
      });
    },
    [],
  );

  const clearHistory = useCallback(() => setHistory([]), []);

  // ── Drag guard ───────────────────────────────────────────────────────────
  const stopParentEditorDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // ── Skip-feedback flag ───────────────────────────────────────────────────
  const skipNextExternalSyncRef = useRef(false);

  // ── Error state ──────────────────────────────────────────────────────────
  const [parseError, setParseError] = useState<string | null>(null);

  // ── UI → Code: subscribe to Redux widget changes ─────────────────────────
  const storeJson = useSelector(
    (state: DefaultRootState) => serializePageDsl(getCanvasWidgets(state)),
    (left, right) => left === right,
  );

  const [editorText, setEditorText] = useState(storeJson);

  // ── AI panel state ────────────────────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Generated JS panel ────────────────────────────────────────────────────
  const [generatedJs, setGeneratedJs] = useState<string | null>(null);
  const [jsCopied, setJsCopied] = useState(false);

  const handleCopyJs = useCallback(() => {
    if (!generatedJs) return;

    navigator.clipboard.writeText(generatedJs).then(() => {
      setJsCopied(true);
      setTimeout(() => setJsCopied(false), 2000);
    });
  }, [generatedJs]);

  // ── Code → UI: parse JSON and dispatch ───────────────────────────────────
  const applyParsedDsl = useCallback(
    (raw: string) => {
      try {
        const nested = JSON.parse(raw) as NestedDSL<WidgetProps>;
        const validErr = validateNestedDsl(nested);

        if (validErr) {
          setParseError(validErr);

          return;
        }

        const flat = flattenDSL(nested);

        skipNextExternalSyncRef.current = true;
        setParseError(null);
        dispatch(
          updateAndSaveLayout(flat as CanvasWidgetsReduxState, {
            shouldReplay: true,
          }),
        );
      } catch (e) {
        setParseError(e instanceof Error ? e.message : "Invalid JSON");
      }
    },
    [dispatch],
  );

  const debouncedApply = useMemo(
    () => debounce(applyParsedDsl, 300),
    [applyParsedDsl],
  );

  useEffect(() => () => debouncedApply.cancel(), [debouncedApply]);

  useEffect(() => {
    debouncedApply.cancel();

    if (skipNextExternalSyncRef.current) {
      skipNextExternalSyncRef.current = false;

      return;
    }

    setEditorText(storeJson);
    setParseError(null);
  }, [storeJson, debouncedApply]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const next = value ?? "";

      setEditorText(next);
      debouncedApply(next);
    },
    [debouncedApply],
  );

  const handleApplyCode = useCallback(() => {
    debouncedApply.cancel();
    applyParsedDsl(editorText);
  }, [applyParsedDsl, debouncedApply, editorText]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(editorText) as NestedDSL<WidgetProps>;
      const formatted = JSON.stringify(parsed, null, 2);

      setEditorText(formatted);
      setParseError(null);
      debouncedApply.cancel();
      applyParsedDsl(formatted);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [applyParsedDsl, debouncedApply, editorText]);

  // ── AI Generate ───────────────────────────────────────────────────────────
  const handleAiGenerate = useCallback(async () => {
    const trimmedPrompt = aiPrompt.trim();

    if (!trimmedPrompt) return;

    setIsAiLoading(true);
    setAiError(null);
    setGeneratedJs(null);

    try {
      const currentNested = JSON.parse(storeJson);
      const currentFlat = flattenDSL(currentNested) as CanvasWidgetsReduxState;

      const result = await generateAndApplyDsl(trimmedPrompt, currentFlat, {
        mergeIntoExisting: true,
        aiConfig: { provider: selectedProvider },
        pageContext,
        extraContext,
        history,
      });

      setEditorText(result.formattedJson);
      setParseError(null);

      if (result.jsCode) {
        setGeneratedJs(result.jsCode);
      }

      skipNextExternalSyncRef.current = true;
      dispatch(updateAndSaveLayout(result.flatDsl, { shouldReplay: true }));

      // Store turn for iterative follow-ups
      addTurn(
        result.userMessage,
        result.assistantMessage,
        trimmedPrompt.slice(0, 60),
      );
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI generation failed.");
    } finally {
      setIsAiLoading(false);
    }
  }, [
    aiPrompt,
    dispatch,
    selectedProvider,
    pageContext,
    extraContext,
    history,
    storeJson,
    addTurn,
  ]);

  const displayError = parseError || aiError;

  return (
    <SplitRoot data-testid="t--page-dsl-monaco-split">
      {/* ── Left: Monaco editor column ── */}
      <EditorColumn onDragStart={stopParentEditorDrag}>
        {/* Toolbar */}
        <EditorToolbar>
          <Text kind="heading-xs">GenSmith — Page DSL</Text>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <GenSmithHelp />
            <Button kind="secondary" onClick={handleFormat} size="sm">
              Format
            </Button>
            <Button kind="primary" onClick={handleApplyCode} size="sm">
              Apply Code
            </Button>
            {props.onClose && (
              <Button kind="tertiary" onClick={props.onClose} size="sm">
                ✕ Exit
              </Button>
            )}
          </div>
        </EditorToolbar>

        {/* AI panel */}
        <AiPanel>
          {/* Row 1: label + provider selector + history chip */}
          <AiPanelRow>
            <AiLabel>✦ AI Generate</AiLabel>
            {availableProviders.length > 0 && (
              <ProviderSelect
                disabled={isAiLoading}
                onChange={handleProviderChange}
                title="Switch AI provider"
                value={selectedProvider}
              >
                {availableProviders.map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABELS[p]}
                  </option>
                ))}
              </ProviderSelect>
            )}
            {history.length > 0 && (
              <HistoryChip
                onClick={clearHistory}
                title={`${history.length} conversation turn(s) — click to clear history`}
              >
                🕓 {history.length} {history.length === 1 ? "turn" : "turns"} ✕
              </HistoryChip>
            )}
          </AiPanelRow>

          {/* Prompt textarea */}
          <PromptTextarea
            disabled={isAiLoading}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                void handleAiGenerate();
              }
            }}
            placeholder={
              'Describe your UI changes… e.g. "Add a data table for candidates with columns name, email"'
            }
            value={aiPrompt}
          />

          {/* Row 2: generate button + extra context toggle */}
          <AiPanelRow>
            <Button
              isDisabled={isAiLoading || !aiPrompt.trim()}
              isLoading={isAiLoading}
              kind="primary"
              onClick={() => void handleAiGenerate()}
              size="sm"
            >
              {isAiLoading ? "Generating…" : "AI Generate  ⌘↵"}
            </Button>
            <ContextToggle
              onClick={() => setShowExtraContext((v) => !v)}
              title="Add extra context: schema details, return shapes, business rules"
              type="button"
            >
              {showExtraContext ? "▾" : "▸"} Extra context
            </ContextToggle>
            {aiError && (
              <Button
                kind="tertiary"
                onClick={() => setAiError(null)}
                size="sm"
              >
                Clear error
              </Button>
            )}
          </AiPanelRow>

          {/* Extra context textarea (collapsible) */}
          {showExtraContext && (
            <ContextTextarea
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder={
                "Optional: paste query return shapes or extra business rules.\n" +
                "Example: GetCandidates returns [{name: string, email: string}]\n" +
                "         AddCandidate expects body.name and body.email"
              }
              value={extraContext}
            />
          )}
        </AiPanel>

        {/* Inline error banner */}
        {displayError && (
          <ErrorBanner>
            <Text color="var(--ads-v2-color-fg-error)" kind="body-s">
              {displayError}
            </Text>
          </ErrorBanner>
        )}

        {/* Generated JS panel */}
        {generatedJs && (
          <JsPanel>
            <JsPanelHeader>
              <JsPanelTitle>✦ Generated JS Object</JsPanelTitle>
              <div style={{ display: "flex", gap: 6 }}>
                <CopyBtn onClick={handleCopyJs} type="button">
                  {jsCopied ? "✓ Copied!" : "Copy"}
                </CopyBtn>
                <CopyBtn
                  onClick={() => setGeneratedJs(null)}
                  style={{
                    color: "#f38ba8",
                    borderColor: "rgba(243,139,168,0.3)",
                  }}
                  type="button"
                >
                  ✕
                </CopyBtn>
              </div>
            </JsPanelHeader>
            <JsCode>{generatedJs}</JsCode>
          </JsPanel>
        )}

        {/* Monaco surface */}
        <EditorSurface>
          <EditorErrorBoundary>
            <Editor
              defaultLanguage="json"
              onChange={handleEditorChange}
              options={{
                automaticLayout: true,
                fontSize: 12,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 2,
                wordWrap: "on",
              }}
              theme="vs-light"
              value={editorText}
            />
          </EditorErrorBoundary>
        </EditorSurface>
      </EditorColumn>

      {/* ── Right: live canvas preview ── */}
      <PreviewColumn>
        <PreviewChrome>{props.children}</PreviewChrome>
      </PreviewColumn>
    </SplitRoot>
  );
}
