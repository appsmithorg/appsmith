import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
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
import { js_beautify } from "js-beautify";
import { useEffect } from "react";
import { ValidationTypes } from "constants/WidgetValidation";
import { debounce } from "lodash";
import { Snippet, SnippetArgument } from "./utils";
import { createMessage, SEARCH_ITEM_SELECT } from "constants/messages";
import { getExpectedValue } from "utils/validation/common";
import { ControlIcons } from "icons/ControlIcons";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

SyntaxHighlighter.registerLanguage("sql", sql);

const SnippetContainer = styled.div`
  display: flex;
  flex-direction: column;
  .snippet-container {
    position: relative;
    .t--copy-snippet {
      position: absolute;
      top: 5px;
      right: 5px;
      opacity: 0.3;
      svg > path {
        fill: gray;
      }
      &:hover {
        transform: scale(1.1);
      }
    }
    &:hover {
      .t--copy-snippet {
        opacity: 1;
      }
    }
    .t--run-snippet {
      position: absolute;
      top: 10px;
      right: 10px;
      svg > path {
        fill: green;
      }
    }
    pre {
      padding: 1.5em 1em !important;
    }
  }
  .snippet-title {
    color: #090707;
    font-size: 17px;
    font-weight: 500;
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
    color: #4b4848;
    font-size: 14px;
    font-weight: 400;
    margin: 10px 0;
  }
  .snippet-group {
    margin: 5px 0;
    .header {
      font-weight: 500;
      font-size: 14px;
    }
    .content {
      font-weight: 400;
      font-size: 14px;
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
    .danger {
      color: red;
      font-size: 12px;
    }
  }
  .tab-container {
    border-top: none;
    .react-tabs__tab-panel {
      background: white !important;
      height: auto !important;
      overflow: clip;
      margin-top: 2px;
      border-top: 1px solid #f0f0f0;
      code {
        .token.arrow {
          background: transparent !important;
        }
      }
      .actions-container {
        display: flex;
        margin: 30px 0 15px;
        button {
          margin-right: 5px;
        }
        .copy-snippet-btn {
          border: 2px solid #a9a7a7;
          color: #a9a7a7;
          background: white;
          transition: 0.5s;
        }
      }
    }
    .react-tabs__tab-list {
      background: white !important;
      padding: 0 10px !important;
    }
  }
`;

const removeDynamicBinding = (value: string) => {
  const regex = /{{(.*?)}}/g;
  return value.replace(regex, function(match, capture) {
    return capture;
  });
};

const CopyIcon = ControlIcons.COPY_CONTROL;

export const getSnippet = (snippet: string, args: any) => {
  const regex = /{{(.*?)}}/g;
  return snippet.replace(regex, function(match, capture) {
    const substitution = (args[capture] || "")
      .replaceAll("{{", "")
      .replaceAll("}}", "");
    return substitution || capture;
  });
};

export default function SnippetDescription({ item }: { item: Snippet }) {
  const {
    body: {
      additionalInfo,
      args,
      isTrigger,
      snippet,
      summary,
      template,
      title,
    },
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
    // [validations, setValidations] = useState<
    //   Record<string, ValidationResponse>
    // >(),
    evaluatedArguments = useSelector(
      (state: AppState) =>
        state.ui.globalSearch.filterContext.evaluatedArguments,
    );

  const handleArgsValidation = useCallback((value, arg) => {
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
  }, []);

  const handleCopy = useCallback((value) => {
    copy(value);
    Toaster.show({
      text: "Snippet copied to clipboard",
      variant: Variant.success,
    });
  }, []);

  const handleRun = useCallback(() => {
    dispatch(
      setGlobalSearchFilterContext({
        executionInProgress: true,
      }),
    );
    dispatch(
      evaluateSnippet({
        expression: getSnippet(template, selectedArgs),
        dataType: dataType,
        isTrigger,
      }),
    );
  }, [snippet, selectedArgs, dataType]);

  const handleArgChange = useCallback(
    debounce((value, arg) => {
      setSelectedArgs({
        ...selectedArgs,
        [arg.name]: value,
      });
      if (arg.type && Object.values(ValidationTypes).includes(arg.type))
        handleArgsValidation(value, arg);
    }, 500),
    [selectedArgs],
  );

  // useEffect(() => {
  //   const validations: any = Object.values(evaluatedArguments);
  //   setValidations(
  //     validations.reduce(
  //       (acc: any, arg: SnippetArgument & { value: string }) => {
  //         acc[arg.name] = validate(
  //           { type: getArgValidationType(arg.type) },
  //           arg.value,
  //           {},
  //         );
  //         return acc;
  //       },
  //       {},
  //     ),
  //   );
  // }, [evaluatedArguments]);

  useEffect(() => {
    document
      .querySelector("#snippet-evaluator")
      ?.scrollIntoView({ behavior: "smooth" });
  }, [evaluatedSnippet]);

  useEffect(() => {
    setSelectedIndex(0);
    setEvaluatedSnippet("");
    setSelectedArgs({});
    unsetEvaluatedArgument();
  }, [title]);

  const getEvaluatedSnippet = (value: string) => ({ value });

  const tabs = [
    {
      key: "Snippet",
      title: "Snippet",
      panelComponent: (
        <div className="snippet-container">
          <SyntaxHighlighter language={language} style={prism} wrapLongLines>
            {js_beautify(snippet, { indent_size: 2 })}
          </SyntaxHighlighter>
          <CopyIcon
            className="t--copy-snippet"
            height={14}
            onClick={() => handleCopy(`{{ ${getSnippet(snippet, {})} }}`)}
            width={14}
          />
        </div>
      ),
    },
  ];
  if (template && language === "javascript") {
    tabs.push({
      key: "Customize",
      title: "Customize",
      panelComponent:
        args && args.length > 0 ? (
          <>
            <div className="snippet-container">
              <SyntaxHighlighter
                language={language}
                style={prism}
                wrapLongLines
              >
                {js_beautify(getSnippet(template, selectedArgs), {
                  indent_size: 2,
                })}
              </SyntaxHighlighter>
              <CopyIcon
                className="t--copy-snippet"
                height={14}
                onClick={() =>
                  handleCopy(`{{ ${getSnippet(template, selectedArgs)} }}`)
                }
                width={14}
              />
            </div>
            <div className="snippet-group">
              {args.map((arg: SnippetArgument) => (
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
                    showLightningMenu={false}
                    size={EditorSize.EXTENDED}
                    tabBehaviour={TabBehaviour.INDENT}
                    theme={EditorTheme.LIGHT}
                    useValidationMessage
                  />
                  {/* {validations && (
                    <span className="danger">
                      {validations[arg.name]?.message}
                    </span>
                  )} */}
                </div>
              ))}
              <div className="actions-container">
                <Button
                  className="t--apiFormRunBtn"
                  disabled={executionInProgress}
                  onClick={handleRun}
                  size={Size.medium}
                  tag="button"
                  text="Run"
                  type="button"
                />
              </div>
              <div id="snippet-evaluator">
                {evaluatedSnippet && (
                  <div className="snippet-group">
                    <div className="header">Evaluated Snippet</div>
                    <div className="content">
                      <ReadOnlyEditor
                        folding
                        height="300px"
                        input={getEvaluatedSnippet(evaluatedSnippet)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div />
        ),
    });
  }
  return (
    <SnippetContainer>
      <div className="snippet-title">
        <span>{title}</span>
        <span className="action-msg">{createMessage(SEARCH_ITEM_SELECT)}</span>
      </div>
      <div className="snippet-desc">{summary}</div>
      <TabbedViewContainer className="tab-container">
        <TabComponent
          onSelect={setSelectedIndex}
          selectedIndex={selectedIndex}
          tabs={tabs}
        />
      </TabbedViewContainer>
      {additionalInfo &&
        additionalInfo.map(({ content, header }) => (
          <div className="snippet-group" key={header}>
            <div className="header">{header}</div>
            <div className="content">{content}</div>
          </div>
        ))}
    </SnippetContainer>
  );
}
