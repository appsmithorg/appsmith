import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import sql from "react-syntax-highlighter/dist/cjs/languages/prism/sql";
import { prism } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { TabbedViewContainer } from "pages/Editor/APIEditor/Form";
import { TabComponent } from "components/ads/Tabs";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "../CodeEditor/EditorConfig";
import CodeEditor from "../CodeEditor";
import Button, { Size } from "components/ads/Button";
import {
  evaluateArgument,
  evaluateSnippet,
  setEvaluatedArgument,
  setEvaluatedSnippet,
  setGlobalSearchFilterContext,
  unsetEvaluatedArgument,
} from "actions/globalSearchActions";
import { useSelector } from "store";
import { AppState } from "reducers";
import ReadOnlyEditor from "../ReadOnlyEditor";
import copy from "copy-to-clipboard";
import { useEffect } from "react";
import { ValidationTypes } from "constants/WidgetValidation";
import { debounce } from "lodash";
import { Snippet, SnippetArgument } from "./utils";
import {
  createMessage,
  SNIPPET_COPY,
  SNIPPET_EXECUTE,
  SNIPPET_INSERT,
} from "@appsmith/constants/messages";
import { getExpectedValue } from "utils/validation/common";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { ReactComponent as CopyIcon } from "assets/icons/menu/copy-snippet.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getTypographyByKey } from "constants/DefaultTheme";
import { SnippetAction } from "reducers/uiReducers/globalSearchReducer";
import { Layers } from "constants/Layers";

SyntaxHighlighter.registerLanguage("sql", sql);

const SnippetContainer = styled.div`
  display: flex;
  flex-direction: column;
  .snippet-container {
    margin-top: ${(props) => props.theme.spaces[4]}px;
    position: relative;
    border: 1px solid
      ${(props) => props.theme.colors.globalSearch.snippets.codeContainerBorder};
    .action-icons {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      transition: 0.2s opacity ease;
      background: ${(props) =>
        props.theme.colors.globalSearch.documentationCodeBackground};
      justify-content: space-between;
    }
    .action-icons > * {
      height: 12px;
      width: 12px;
      cursor: pointer;
      transition: 0.2s all ease;
      &:hover {
        transform: scale(1.2);
      }
      margin: ${(props) => props.theme.spaces[2]}px;
    }
    pre {
      padding: ${(props) => props.theme.spaces[11]}px
        ${(props) => props.theme.spaces[5]}px !important;
      margin: 0 !important;
      background: ${(props) =>
        props.theme.colors.globalSearch.codeBackground} !important;
      white-space: pre-wrap;
      border: none;
    }
  }
  .snippet-title {
    color: ${(props) => props.theme.colors.globalSearch.primaryTextColor};
    ${(props) => getTypographyByKey(props, "h3")}
    display: flex;
    justify-content: space-between;
    .action-msg {
      color: #a9a7a7;
      font-size: 11px;
      font-weight: 400;
      flex-shrink: 0;
    }
  }
  .snippet-desc {
    color: ${(props) => props.theme.colors.globalSearch.secondaryTextColor};
    ${(props) => getTypographyByKey(props, "p1")}
    margin: 10px 0;
  }
  .snippet-group {
    margin: 5px 0;
    .header {
      ${(props) => getTypographyByKey(props, "p1")}
      font-weight: 500;
    }
    .content {
      ${(props) => getTypographyByKey(props, "p1")}
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
  }
  .tab-container {
    border-top: none;
    .react-tabs__tab-panel {
      background: white !important;
      height: auto !important;
      overflow: clip;
      border-top: 1px solid
        ${(props) => props.theme.colors.globalSearch.primaryBorderColor};
      code {
        .token.arrow {
          background: transparent !important;
        }
      }
      .actions-container {
        display: flex;
        margin: 30px 0 15px;
      }
    }
    .react-tabs__tab-list {
      background: white !important;
      padding: 0 10px !important;
      height: 30px;
    }
  }
`;

const removeDynamicBinding = (value: string) => {
  const regex = /{{([\s\S]*?)}}/g;
  return value.replace(regex, function(match, capture) {
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
    function(match, capture) {
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
  const [selectedIndex, setSelectedIndex] = useState(0),
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
    setSelectedIndex(0);
    dispatch(setEvaluatedSnippet(""));
    setSelectedArgs({});
    dispatch(unsetEvaluatedArgument());
  }, [title]);

  const handleCopy = useCallback(
    (value) => {
      copy(value);
      Toaster.show({
        text: "Snippet copied to clipboard",
        variant: Variant.success,
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
              <CopyIcon
                onClick={() =>
                  handleCopy(getSnippet(snippet, {}, hideOuterBindings))
                }
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
              <CopyIcon
                onClick={() =>
                  handleCopy(
                    getSnippet(template, selectedArgs, hideOuterBindings),
                  )
                }
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
                <CodeEditor
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
                  disabled={executionInProgress}
                  onClick={handleRun}
                  size={Size.medium}
                  tag="button"
                  text="Run"
                  type="button"
                />
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
      <div className="snippet-title">
        <span>{title}</span>
        <span className="action-msg">
          {createMessage(
            selectedIndex === 0
              ? onEnter === SnippetAction.INSERT
                ? SNIPPET_INSERT
                : SNIPPET_COPY
              : SNIPPET_EXECUTE,
          )}
        </span>
      </div>
      <div className="snippet-desc">{summary}</div>
      <TabbedViewContainer className="tab-container">
        <TabComponent
          onSelect={(selectedIndex: number) => {
            if (selectedIndex === 1) {
              AnalyticsUtil.logEvent("SNIPPET_CUSTOMIZE", { title });
            }
            setSelectedIndex(selectedIndex);
          }}
          selectedIndex={selectedIndex}
          tabs={tabs}
        />
      </TabbedViewContainer>
    </SnippetContainer>
  );
}
