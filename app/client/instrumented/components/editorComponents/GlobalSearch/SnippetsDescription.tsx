import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import sql from "react-syntax-highlighter/dist/cjs/languages/prism/sql";
import { prism } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { TabbedViewContainer } from "pages/Editor/APIEditor/CommonEditorForm";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "../CodeEditor/EditorConfig";
import {
  evaluateArgument,
  evaluateSnippet,
  setEvaluatedArgument,
  setEvaluatedSnippet,
  setGlobalSearchFilterContext,
  unsetEvaluatedArgument,
} from "actions/globalSearchActions";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import ReadOnlyEditor from "../ReadOnlyEditor";
import copy from "copy-to-clipboard";
import { useEffect } from "react";
import { ValidationTypes } from "constants/WidgetValidation";
import { debounce } from "lodash";
import type { Snippet, SnippetArgument } from "./utils";
import {
  createMessage,
  SNIPPET_COPY,
  SNIPPET_EXECUTE,
  SNIPPET_INSERT,
} from "@appsmith/constants/messages";
import { getExpectedValue } from "utils/validation/common";
import { getTypographyByKey } from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { SnippetAction } from "reducers/uiReducers/globalSearchReducer";
import { Layers } from "constants/Layers";
import {
  toast,
  Text,
  Button,
  Tabs,
  TabsList,
  TabPanel,
  Tab,
} from "design-system";
import LazyCodeEditor from "../LazyCodeEditor";

SyntaxHighlighter.registerLanguage("sql", sql);

const SnippetContainer = styled.div`
  display: flex;
  flex-direction: column;
  .snippet-container {
    margin-top: var(--ads-v2-spaces-3);
    position: relative;
    .action-icons {
      position: absolute;
      top: 4px;
      right: 4px;
    }
    pre {
      padding: var(--ads-v2-spaces-7) var(--ads-v2-spaces-5) !important;
      margin: 0 !important;
      background: var(--ads-v2-color-bg) !important;
      white-space: pre-wrap;
      border: none;
      border: 1px solid var(--ads-v2-color-border);
      border-radius: var(--ads-v2-border-radius);
    }
  }
  .snippet-title {
    display: flex;
    justify-content: space-between;
    .action-msg {
      display: flex;
      align-items: center;
      color: var(--ads-v2-color-fg-muted);
      font-size: 11px;
      font-weight: 400;
      flex-shrink: 0;
    }
  }
  .snippet-desc {
    margin: 10px 0;
  }
  .snippet-group {
    margin: 5px 0;
    .header {
      ${getTypographyByKey("p1")}
      font-weight: 500;
    }
    .content {
      ${getTypographyByKey("p1")}
    }
    .argument {
      display: flex;
      justify-content: space-between;
      flex-direction: column;
      margin: 5px 0;
      .args-dropdown {
        box-shadow: none;
        background-color: ${(props) => props.theme.colors.propertyPane.bg};
        border: none;
      }
      .t--no-binding-prompt {
        background-color: #6a86ce;
        span {
          color: #6a86ce;
        }
      }
    }
    .cm-s-duotone-light.CodeMirror {
      border-radius: var(--ads-v2-border-radius);
      border: 1px solid var(--ads-v2-color-border);
    }
  }
`;

const removeDynamicBinding = (value: string) => {
  const regex = /{{([\s\S]*?)}}/g;
  return value.replace(regex, function (match, capture) {
    return capture;
  });
};

export const getSnippet = (
  snippet: string,
  args: any,
  hideOuterBindings = false,
  replaceWithDynamicBinding = false,
) => {
  const templateSubstitutionRegex = /%%(.*?)%%/g;
  const snippetReplacedWithCustomizedValues = snippet.replace(
    templateSubstitutionRegex,
    function (match, capture) {
      const substitution = removeDynamicBinding(args[capture] || "");
      return replaceWithDynamicBinding
        ? `{{${capture}}}`
        : substitution || capture;
    },
  );
  return hideOuterBindings
    ? removeDynamicBinding(snippetReplacedWithCustomizedValues)
    : snippetReplacedWithCustomizedValues;
};

export default function SnippetDescription({ item }: { item: Snippet }) {
  const {
    body: { args, isTrigger, snippet, snippetMeta, summary, template, title },
    dataType,
    language,
  } = item;
  const [selectedTab, setSelectedTab] = useState("Snippet"),
    [selectedArgs, setSelectedArgs] = useState<any>({}),
    dispatch = useDispatch(),
    evaluatedSnippet = useSelector(
      (state: AppState) => state.ui.globalSearch.filterContext.evaluatedSnippet,
    ),
    executionInProgress = useSelector(
      (state: AppState) =>
        state.ui.globalSearch.filterContext.executionInProgress,
    ),
    evaluatedArguments = useSelector(
      (state: AppState) =>
        state.ui.globalSearch.filterContext.evaluatedArguments,
    ),
    onEnter = useSelector(
      (state: AppState) => state.ui.globalSearch.filterContext.onEnter,
    ),
    hideOuterBindings = useSelector(
      (state: AppState) =>
        state.ui.globalSearch.filterContext.hideOuterBindings,
    );

  const handleArgsValidation = useCallback(
    debounce((value, arg) => {
      const { name, type } = arg;
      if (!value) {
        dispatch(setEvaluatedArgument({ [arg.name]: {} }));
      } else {
        dispatch(
          evaluateArgument({
            name,
            value: removeDynamicBinding(value),
            type,
          }),
        );
      }
    }, 500),
    [],
  );

  useEffect(() => {
    setSelectedTab("Snippet");
    dispatch(setEvaluatedSnippet(""));
    setSelectedArgs({});
    dispatch(unsetEvaluatedArgument());
  }, [title]);

  const handleCopy = useCallback(
    (value) => {
      copy(value);
      toast.show("Snippet copied to clipboard", {
        kind: "success",
      });
      AnalyticsUtil.logEvent("SNIPPET_COPIED", { snippet: value, title });
    },
    [title],
  );

  const handleRun = useCallback(() => {
    if (executionInProgress) return;
    dispatch(
      setGlobalSearchFilterContext({
        executionInProgress: true,
      }),
    );
    dispatch(
      evaluateSnippet({
        expression: getSnippet(template, selectedArgs, true),
        dataType: dataType,
        isTrigger,
      }),
    );
    AnalyticsUtil.logEvent("SNIPPET_EXECUTE", {
      snippet: getSnippet(template, selectedArgs),
      title,
    });
  }, [snippet, selectedArgs, dataType]);

  const handleArgChange = useCallback(
    (value, arg) => {
      setSelectedArgs({
        ...selectedArgs,
        [arg.name]: value,
      });
      if (arg.type && Object.values(ValidationTypes).includes(arg.type))
        handleArgsValidation(value, arg);
    },
    [selectedArgs],
  );

  useEffect(() => {
    if (!executionInProgress)
      document
        .querySelector("#snippet-evaluator")
        ?.scrollIntoView({ behavior: "smooth" });
  }, [executionInProgress]);

  const tabs = [
    {
      key: "Snippet",
      title: "Snippet",
      panelComponent: (
        <>
          {snippetMeta && (
            <div className="snippet-group">
              <div
                className="content"
                dangerouslySetInnerHTML={{ __html: snippetMeta }}
              />
            </div>
          )}
          <div className="snippet-container">
            <SyntaxHighlighter language={language} style={prism}>
              {getSnippet(snippet, {}, hideOuterBindings, true)}
            </SyntaxHighlighter>
            <div className="action-icons">
              <Button
                isIconButton
                kind="tertiary"
                onClick={() =>
                  handleCopy(getSnippet(snippet, {}, hideOuterBindings))
                }
                size="sm"
                startIcon="duplicate"
              />
            </div>
          </div>
        </>
      ),
    },
  ];
  const replaceableArgs = (args || []).filter((arg) => !arg.placeholder);
  if (template && replaceableArgs && replaceableArgs.length > 0) {
    tabs.push({
      key: "Customize",
      title: "Customize",
      panelComponent: (
        <>
          <div className="snippet-container">
            <SyntaxHighlighter language={language} style={prism}>
              {getSnippet(template, selectedArgs, hideOuterBindings)}
            </SyntaxHighlighter>
            <div className="action-icons">
              <Button
                isIconButton
                kind="tertiary"
                onClick={() =>
                  handleCopy(
                    getSnippet(template, selectedArgs, hideOuterBindings),
                  )
                }
                size="sm"
                startIcon="duplicate"
              />
            </div>
          </div>
          <div className="snippet-group">
            {replaceableArgs.map((arg: SnippetArgument) => (
              <div
                className="argument"
                key={arg.name}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <span>{arg.name}</span>
                <LazyCodeEditor
                  errors={evaluatedArguments[arg.name]?.errors}
                  evaluatedValue={evaluatedArguments[arg.name]?.value}
                  expected={getExpectedValue({ type: arg.type })}
                  input={{
                    value: selectedArgs[arg.name],
                    onChange: (value: any) => handleArgChange(value, arg),
                  }}
                  isInvalid={evaluatedArguments[arg.name]?.isInvalid}
                  mode={EditorModes.TEXT_WITH_BINDING}
                  popperPlacement="right-start"
                  popperZIndex={Layers.portals}
                  showLightningMenu={false}
                  size={EditorSize.EXTENDED}
                  tabBehaviour={TabBehaviour.INDENT}
                  theme={EditorTheme.LIGHT}
                  useValidationMessage
                />
              </div>
            ))}
            <div className="actions-container">
              {language === "javascript" && (
                <Button
                  className="t--apiFormRunBtn snippet-execute"
                  isDisabled={executionInProgress}
                  onClick={handleRun}
                  size="md"
                >
                  Run
                </Button>
              )}
            </div>
            <div id="snippet-evaluator">
              {evaluatedSnippet && (
                <div className="snippet-group">
                  <div className="header">Evaluated Snippet</div>
                  <div className="content">
                    <ReadOnlyEditor
                      folding
                      height="300px"
                      input={{ value: evaluatedSnippet }}
                      showLineNumbers={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ),
    });
  }
  return (
    <SnippetContainer>
      <Text className="snippet-title" kind="heading-s">
        <span>{title}</span>
        <span className="action-msg">
          {createMessage(
            selectedTab === "Snippet"
              ? onEnter === SnippetAction.INSERT
                ? SNIPPET_INSERT
                : SNIPPET_COPY
              : SNIPPET_EXECUTE,
          )}
        </span>
      </Text>
      <Text className="snippet-desc" kind="body-s">
        {summary}
      </Text>
      <TabbedViewContainer className="tab-container">
        <Tabs
          onValueChange={() => {
            setSelectedTab(
              selectedTab === "Customize" ? "Snippet" : "Customize",
            );
            if (selectedTab === "Customize") {
              AnalyticsUtil.logEvent("SNIPPET_CUSTOMIZE", { title });
            }
          }}
          value={selectedTab}
        >
          <TabsList>
            {tabs.map((tab) => {
              return (
                <Tab key={tab.key} value={tab.key}>
                  {tab.title}
                </Tab>
              );
            })}
          </TabsList>
          {tabs.map((tab) => {
            return (
              <TabPanel key={tab.key} value={tab.key}>
                {tab.panelComponent}
              </TabPanel>
            );
          })}
        </Tabs>
      </TabbedViewContainer>
    </SnippetContainer>
  );
}
