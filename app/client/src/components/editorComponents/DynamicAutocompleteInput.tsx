import React, { Component, lazy, Suspense } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import styled, { createGlobalStyle } from "styled-components";
import CodeMirror, { EditorConfiguration, LineHandle } from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/display/placeholder";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/display/autorefresh";
import "codemirror/addon/mode/multiplex";
import "codemirror/addon/tern/tern.css";
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import HelperTooltip from "components/editorComponents/HelperTooltip";
import EvaluatedValuePopup from "components/editorComponents/EvaluatedValuePopup";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import _ from "lodash";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { Theme, Skin } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import TernServer from "utils/autocomplete/TernServer";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
const LightningMenu = lazy(() =>
  import("components/editorComponents/LightningMenu"),
);
require("codemirror/mode/javascript/javascript");
require("codemirror/mode/sql/sql");
require("codemirror/addon/hint/sql-hint");

CodeMirror.defineMode("sql-js", function(config) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, "text/x-sql"),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
        globalVars: true,
      }),
    },
    // .. more multiplexed styles can follow here
  );
});

CodeMirror.defineMode("js-js", function(config) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, { name: "javascript", json: true }),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
        globalVars: true,
      }),
    },
    // .. more multiplexed styles can follow here
  );
});

const getBorderStyle = (
  props: { theme: Theme } & {
    editorTheme?: EditorTheme;
    hasError: boolean;
    singleLine: boolean;
    isFocused: boolean;
    disabled?: boolean;
  },
) => {
  if (props.hasError) return props.theme.colors.error;
  if (props.editorTheme !== THEMES.DARK) {
    if (props.isFocused) return props.theme.colors.inputActiveBorder;
    return props.theme.colors.border;
  }
  return "transparent";
};

const HintStyles = createGlobalStyle<{ editorTheme: EditorTheme }>`
  .CodeMirror-hints {
    position: absolute;
    z-index: 20;
    overflow: hidden;
    list-style: none;
    margin: 0;
    padding: 5px;
    font-size: 90%;
    font-family: monospace;
    max-height: 20em;
    width: 200px;
    overflow-y: auto;
    background: ${props =>
      props.editorTheme === "DARK" ? "#090A0F" : "#ffffff"};
    border: 1px solid;
    border-color: ${props =>
      props.editorTheme === "DARK" ? "#535B62" : "#EBEFF2"}
    box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
    border-radius: 4px;
  }

  .CodeMirror-hint {
    height: 32px;
    padding: 3px;
    margin: 0;
    white-space: pre;
    color: ${props => (props.editorTheme === "DARK" ? "#F4F4F4" : "#1E242B")};
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  li.CodeMirror-hint-active {
    background: ${props =>
      props.editorTheme === "DARK"
        ? "rgba(244,244,244,0.1)"
        : "rgba(128,136,141,0.1)"};
    border-radius: 4px;
  }
  .CodeMirror-Tern-completion {
    padding-left: 22px !important;
  }
  .CodeMirror-Tern-completion:before {
    left: 4px !important;
    bottom: 7px !important;
    line-height: 15px !important;
  }
  .CodeMirror-Tern-tooltip {
    z-index: 20 !important;
  }
  .CodeMirror-Tern-hint-doc {
    background-color: ${props =>
      props.editorTheme === "DARK" ? "#23292e" : "#fff"} !important;
    color: ${props =>
      props.editorTheme === "DARK" ? "#F4F4F4" : "#1E242B"} !important;
    max-height: 150px;
    width: 250px;
    padding: 12px !important;
    border: 1px solid !important;
    border-color: ${props =>
      props.editorTheme === "DARK" ? "#23292e" : "#DEDEDE"} !important;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.12) !important;
    overflow: scroll;
  }
`;

const EditorWrapper = styled.div<{
  editorTheme?: EditorTheme;
  hasError: boolean;
  singleLine: boolean;
  isFocused: boolean;
  disabled?: boolean;
  setMaxHeight?: boolean;
}>`
  width: 100%;
  ${props =>
    props.singleLine && props.isFocused
      ? `
  z-index: 5;
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  `
      : `z-index: 0; position: relative;`}
  background-color: ${props =>
    props.editorTheme === THEMES.DARK ? "#272822" : "#fff"};
  background-color: ${props => props.disabled && "#eef2f5"};
  border: 1px solid;
  border-color: ${getBorderStyle};
  border-radius: 4px;
  display: flex;
  flex: 1;
  flex-direction: row;
  text-transform: none;
  min-height: 32px;

  height: auto;
  ${props =>
    props.setMaxHeight &&
    props.isFocused &&
    `
  z-index: 5;
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  `}
  ${props => props.setMaxHeight && !props.isFocused && `max-height: 30px;`}
  && {
    .binding-highlight {
      color: ${props =>
        props.editorTheme === THEMES.DARK
          ? props.theme.colors.bindingTextDark
          : props.theme.colors.bindingText};
      font-weight: 700;
    }
    .CodeMirror {
      flex: 1;
      line-height: 21px;
      z-index: 0;
      border-radius: 4px;
      height: auto;
    }
    ${props =>
      props.disabled &&
      `
    .CodeMirror-cursor {
      display: none !important;
    }
    `}
    .CodeMirror pre.CodeMirror-placeholder {
      color: #a3b3bf;
    }
    ${props =>
      props.singleLine &&
      `
      .CodeMirror-hscrollbar {
      -ms-overflow-style: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
    `}
  }
  && {
    .CodeMirror-lines {
      background-color: ${props => props.disabled && "#eef2f5"};
      cursor: ${props => (props.disabled ? "not-allowed" : "text")}
    }
  }
  .bp3-popover-target {
    padding-right: 10px;
    padding-top: 5px;
  }
  .leftImageStyles {
    width: 20px;
    height: 20px;
    margin: 5px;
  }
  .linkStyles {
    margin: 5px;
    margin-right: 11px;
  }
`;

const IconContainer = styled.div`
  .bp3-icon {
    border-radius: 4px 0 0 4px;
    margin: 0;
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #eef2f5;
    svg {
      height: 20px;
      width: 20px;
      path {
        fill: #979797;
      }
    }
  }
  .bp3-popover-target {
    padding-right: 10px;
  }
`;

const DynamicAutocompleteInputWrapper = styled.div<{
  skin: Skin;
  theme: Theme;
  isActive: boolean;
  isNotHover: boolean;
}>`
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
  border: ${props => (props.skin === Skin.DARK ? "1px solid" : "none")};
  border-radius: 2px;
  border-color: ${props =>
    props.isActive && props.skin === Skin.DARK
      ? Colors.ALABASTER
      : "transparent"};

  &:hover {
    border: ${props =>
      props.skin === Skin.DARK ? "1px solid " + Colors.ALABASTER : "none"};
    .lightning-menu {
      background: ${props =>
        !props.isNotHover
          ? props.skin === Skin.DARK
            ? Colors.ALABASTER
            : Colors.BLUE_CHARCOAL
          : ""};
      svg {
        path,
        circle {
          fill: ${props =>
            !props.isNotHover
              ? props.skin === Skin.DARK
                ? Colors.BLUE_CHARCOAL
                : Colors.WHITE
              : ""};
        }
      }
    }
  }
`;

const THEMES: Record<string, EditorTheme> = {
  LIGHT: "LIGHT",
  DARK: "DARK",
};

export type EditorTheme = "LIGHT" | "DARK";

const AUTOCOMPLETE_CLOSE_KEY_CODES = ["Enter", "Tab", "Escape"];

interface ReduxStateProps {
  dynamicData: DataTree;
}

export type DynamicAutocompleteInputProps = {
  placeholder?: string;
  leftIcon?: Function;
  rightIcon?: Function;
  description?: string;
  height?: number;
  theme?: EditorTheme;
  meta?: Partial<WrappedFieldMetaProps>;
  showLineNumbers?: boolean;
  allowTabIndent?: boolean;
  singleLine: boolean;
  mode?: string | object;
  className?: string;
  leftImage?: string;
  disabled?: boolean;
  link?: string;
  baseMode?: string | object;
  setMaxHeight?: boolean;
  showLightningMenu?: boolean;
  dataTreePath?: string;
  evaluatedValue?: any;
  expected?: string;
};

type Props = ReduxStateProps &
  DynamicAutocompleteInputProps & {
    input: Partial<WrappedFieldInputProps>;
  };

type State = {
  isFocused: boolean;
  isOpened: boolean;
  autoCompleteVisible: boolean;
};

class DynamicAutocompleteInput extends Component<Props, State> {
  textArea = React.createRef<HTMLTextAreaElement>();
  editor: any;
  ternServer?: TernServer = undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      isFocused: false,
      isOpened: false,
      autoCompleteVisible: false,
    };
    this.updatePropertyValue = this.updatePropertyValue.bind(this);
  }

  componentDidMount(): void {
    if (this.textArea.current) {
      const options: EditorConfiguration = {};
      if (this.props.theme === "DARK") options.theme = "monokai";
      if (!this.props.input.onChange || this.props.disabled) {
        options.readOnly = true;
        options.scrollbarStyle = "null";
      }
      if (this.props.showLineNumbers) options.lineNumbers = true;
      const extraKeys: Record<string, any> = {};
      if (!this.props.allowTabIndent) extraKeys["Tab"] = false;
      this.editor = CodeMirror.fromTextArea(this.textArea.current, {
        mode: this.props.mode || { name: "javascript", globalVars: true },
        viewportMargin: 10,
        tabSize: 2,
        indentWithTabs: !!this.props.allowTabIndent,
        lineWrapping: !this.props.singleLine,
        extraKeys,
        autoCloseBrackets: true,
        ...options,
      });

      this.editor.on("change", _.debounce(this.handleChange, 300));
      this.editor.on("change", this.handleAutocompleteVisibility);
      this.editor.on("keyup", this.handleAutocompleteHide);
      this.editor.on("focus", this.handleEditorFocus);
      this.editor.on("blur", this.handleEditorBlur);
      if (this.props.height) {
        this.editor.setSize(0, this.props.height);
      } else {
        this.editor.setSize(0, "auto");
      }
      this.editor.eachLine(this.highlightBindings);
      // Set value of the editor
      let inputValue = this.props.input.value || "";
      if (typeof inputValue === "object") {
        inputValue = JSON.stringify(inputValue, null, 2);
      } else if (
        typeof inputValue === "number" ||
        typeof inputValue === "string"
      ) {
        inputValue += "";
      }
      this.editor.setValue(inputValue);
      this.startAutocomplete();
    }
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.editor) {
      this.editor.refresh();
      if (!this.state.isFocused) {
        const currentMode = this.editor.getOption("mode");
        const editorValue = this.editor.getValue();
        let inputValue = this.props.input.value;
        // Safe update of value of the editor when value updated outside the editor
        if (typeof inputValue === "object") {
          inputValue = JSON.stringify(inputValue, null, 2);
        } else if (
          typeof inputValue === "number" ||
          typeof inputValue === "string"
        ) {
          inputValue += "";
        }
        if ((!!inputValue || inputValue === "") && inputValue !== editorValue) {
          this.editor.setValue(inputValue);
        }

        if (currentMode !== this.props.mode) {
          this.editor.setOption("mode", this.props?.mode);
        }
      } else {
        // Update the dynamic bindings for autocomplete
        if (prevProps.dynamicData !== this.props.dynamicData) {
          if (this.ternServer) {
            const dataTreeDef = dataTreeTypeDefCreator(this.props.dynamicData);
            this.ternServer.updateDef("dataTree", dataTreeDef);
          } else {
            this.editor.setOption("hintOptions", {
              completeSingle: false,
              globalScope: this.props.dynamicData,
            });
          }
        }
      }
    }
  }

  startAutocomplete() {
    try {
      this.ternServer = new TernServer(this.props.dynamicData);
    } catch (e) {
      console.error(e);
    }
    if (this.ternServer) {
      this.editor.setOption("extraKeys", {
        ...this.editor.options.extraKeys,
        [KeyboardShortcuts.CodeEditor.OpenAutocomplete]: (
          cm: CodeMirror.Editor,
        ) => {
          if (this.ternServer) this.ternServer.complete(cm);
        },
        [KeyboardShortcuts.CodeEditor.ShowTypeAndInfo]: (cm: any) => {
          if (this.ternServer) this.ternServer.showType(cm);
        },
        [KeyboardShortcuts.CodeEditor.OpenDocsLink]: (cm: any) => {
          if (this.ternServer) this.ternServer.showDocs(cm);
        },
      });
    } else {
      // start normal autocomplete
      this.editor.setOption("extraKeys", {
        ...this.editor.options.extraKeys,
        [KeyboardShortcuts.CodeEditor.OpenAutocomplete]: "autocomplete",
      });
      this.editor.setOption("showHint", true);
      this.editor.setOption("hintOptions", {
        completeSingle: false,
        globalScope: this.props.dynamicData,
      });
    }
  }

  handleEditorFocus = () => {
    this.setState({ isFocused: true });
    this.editor.refresh();
    if (this.props.singleLine) {
      this.editor.setOption("lineWrapping", true);
    }
  };

  handleEditorBlur = () => {
    this.handleChange();
    this.setState({ isFocused: false });
    if (this.props.singleLine) {
      this.editor.setOption("lineWrapping", false);
    }
  };

  handleChange = (instance?: any, changeObj?: any) => {
    const value = this.editor.getValue();
    if (changeObj && changeObj.origin === "complete") {
      AnalyticsUtil.logEvent("AUTO_COMPLETE_SELECT", {
        searchString: changeObj.text[0],
      });
    }
    const inputValue = this.props.input.value;
    if (this.props.input.onChange && value !== inputValue) {
      this.props.input.onChange(value);
    }
    this.editor.eachLine(this.highlightBindings);
  };

  handleAutocompleteVisibility = (cm: any) => {
    if (this.state.isFocused) {
      let cursorBetweenBinding = false;
      const cursor = this.editor.getCursor();
      const value = this.editor.getValue();
      let cursorIndex = cursor.ch;
      if (cursor.line > 0) {
        for (let lineIndex = 0; lineIndex < cursor.line; lineIndex++) {
          const line = this.editor.getLine(lineIndex);
          // Add line length + 1 for new line character
          cursorIndex = cursorIndex + line.length + 1;
        }
      }
      const stringSegments = getDynamicStringSegments(value);
      // count of chars processed
      let cumulativeCharCount = 0;
      stringSegments.forEach((segment: string) => {
        const start = cumulativeCharCount;
        const dynamicStart = segment.indexOf("{{");
        const dynamicDoesStart = dynamicStart > -1;
        const dynamicEnd = segment.indexOf("}}");
        const dynamicDoesEnd = dynamicEnd > -1;
        const dynamicStartIndex = dynamicStart + start + 2;
        const dynamicEndIndex = dynamicEnd + start;
        if (
          dynamicDoesStart &&
          cursorIndex >= dynamicStartIndex &&
          ((dynamicDoesEnd && cursorIndex <= dynamicEndIndex) ||
            (!dynamicDoesEnd && cursorIndex >= dynamicStartIndex))
        ) {
          cursorBetweenBinding = true;
        }
        cumulativeCharCount = start + segment.length;
      });

      const shouldShow = cursorBetweenBinding;

      if (this.props.baseMode) {
        // https://github.com/codemirror/CodeMirror/issues/5249#issue-295565980
        cm.doc.modeOption = this.props.baseMode;
      }
      if (shouldShow) {
        AnalyticsUtil.logEvent("AUTO_COMPELTE_SHOW", {});
        this.setState({
          autoCompleteVisible: true,
        });
        if (this.ternServer) {
          this.ternServer.complete(cm);
        } else {
          cm.showHint(cm);
        }
      } else {
        this.setState({
          autoCompleteVisible: false,
        });
        cm.closeHint();
      }
    }
  };

  handleAutocompleteHide = (cm: any, event: KeyboardEvent) => {
    if (AUTOCOMPLETE_CLOSE_KEY_CODES.includes(event.code)) {
      cm.closeHint();
    }
  };

  highlightBindings = (line: LineHandle) => {
    const lineNo = this.editor.getLineNumber(line);
    let match;
    while ((match = AUTOCOMPLETE_MATCH_REGEX.exec(line.text)) != null) {
      const start = match.index;
      const end = AUTOCOMPLETE_MATCH_REGEX.lastIndex;
      this.editor.markText(
        { ch: start, line: lineNo },
        { ch: end, line: lineNo },
        {
          className: "binding-highlight",
        },
      );
    }
  };

  updatePropertyValue(value: string, cursor?: number) {
    if (value) {
      this.editor.setValue(value);
    }
    this.editor.focus();
    if (cursor === undefined) {
      if (value) {
        cursor = value.length - 2;
      } else {
        cursor = 1;
      }
    }
    this.editor.setCursor({
      line: 0,
      ch: cursor,
    });
    this.setState({ isFocused: true }, () => {
      this.handleAutocompleteVisibility(this.editor);
    });
  }

  render() {
    const {
      input,
      meta,
      theme,
      singleLine,
      disabled,
      className,
      setMaxHeight,
      showLightningMenu,
      dataTreePath,
      dynamicData,
      expected,
      evaluatedValue,
    } = this.props;
    const hasError = !!(meta && meta.error);
    let evaluated = evaluatedValue;
    if (dataTreePath) {
      evaluated = _.get(dynamicData, dataTreePath);
    }
    const showEvaluatedValue =
      this.state.isFocused &&
      ("evaluatedValue" in this.props ||
        ("dataTreePath" in this.props && !!this.props.dataTreePath));

    return (
      <DynamicAutocompleteInputWrapper
        theme={this.props.theme}
        skin={this.props.theme === "DARK" ? Skin.DARK : Skin.LIGHT}
        isActive={(this.state.isFocused && !hasError) || this.state.isOpened}
        isNotHover={this.state.isFocused || this.state.isOpened}
      >
        {showLightningMenu !== false && (
          <Suspense fallback={<div />}>
            <LightningMenu
              skin={this.props.theme === "DARK" ? Skin.DARK : Skin.LIGHT}
              updateDynamicInputValue={this.updatePropertyValue}
              isFocused={this.state.isFocused}
              isOpened={this.state.isOpened}
              onOpenLightningMenu={() => {
                this.setState({ isOpened: true });
              }}
              onCloseLightningMenu={() => {
                this.setState({ isOpened: false });
              }}
            />
          </Suspense>
        )}
        <EvaluatedValuePopup
          theme={theme || THEMES.LIGHT}
          isOpen={showEvaluatedValue}
          evaluatedValue={evaluated}
          expected={expected}
          hasError={hasError}
        >
          <EditorWrapper
            editorTheme={theme}
            hasError={hasError}
            singleLine={singleLine}
            isFocused={this.state.isFocused}
            disabled={disabled}
            className={className}
            setMaxHeight={setMaxHeight}
          >
            <HintStyles editorTheme={theme || THEMES.LIGHT} />
            <IconContainer>
              {this.props.leftIcon && <this.props.leftIcon />}
            </IconContainer>

            {this.props.leftImage && (
              <img
                src={this.props.leftImage}
                alt="img"
                className="leftImageStyles"
              />
            )}

            <textarea
              ref={this.textArea}
              {..._.omit(this.props.input, ["onChange", "value"])}
              defaultValue={input.value}
              placeholder={this.props.placeholder}
            />
            {this.props.link && (
              <React.Fragment>
                <a
                  href={this.props.link}
                  target="_blank"
                  className="linkStyles"
                  rel="noopener noreferrer"
                >
                  API documentation
                </a>
              </React.Fragment>
            )}
            {this.props.rightIcon && (
              <div
                style={{ zIndex: 100, position: "absolute", right: "-36px" }}
              >
                <HelperTooltip
                  description={this.props.description}
                  rightIcon={this.props.rightIcon}
                />
              </div>
            )}
          </EditorWrapper>
        </EvaluatedValuePopup>
      </DynamicAutocompleteInputWrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getDataTreeForAutocomplete(state),
});

export default connect(mapStateToProps)(DynamicAutocompleteInput);
