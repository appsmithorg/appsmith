import React, { Component, lazy, Suspense } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import styled, { createGlobalStyle } from "styled-components";
import CodeMirror, { EditorConfiguration, LineHandle } from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/display/placeholder";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/display/autorefresh";
import "codemirror/addon/mode/multiplex";
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import HelperTooltip from "components/editorComponents/HelperTooltip";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import _ from "lodash";
import { parseDynamicString } from "utils/DynamicBindingUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { Theme } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";
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
    editorTheme?: THEME;
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

const HintStyles = createGlobalStyle`
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
    background: #FFFFFF;
    border: 1px solid #EBEFF2;
    box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
    border-radius: 4px;
  }

  .CodeMirror-hint {
    height: 32px;
    padding: 3px;
    margin: 0;
    white-space: pre;
    color: #2E3D49;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  li.CodeMirror-hint-active {
    background: #E9FAF3;
    border-radius: 4px;
  }
`;

const Wrapper = styled.div<{
  editorTheme?: THEME;
  hasError: boolean;
  singleLine: boolean;
  isFocused: boolean;
  disabled?: boolean;
  setMaxHeight?: boolean;
}>`
  ${props =>
    props.singleLine && props.isFocused
      ? `
  z-index: 5;
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  `
      : `z-index: 0; position: relative`}
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
  overflow: hidden;
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
        props.editorTheme === THEMES.DARK ? "#f7c75b" : "#ffb100"};
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

const DynamicAutocompleteInputWrapper = styled.div`
  width: 100%;
  position: relative;
  & > span:first-of-type {
    position: absolute;
    right: 0;
    top: 2px;
    width: 14px;
    z-index: 10;
  }
`;

const THEMES = {
  LIGHT: "LIGHT",
  DARK: "DARK",
};

type THEME = "LIGHT" | "DARK";

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
  theme?: THEME;
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
};

type Props = ReduxStateProps &
  DynamicAutocompleteInputProps & {
    input: Partial<WrappedFieldInputProps>;
  };

type State = {
  isFocused: boolean;
  autoCompleteVisible: boolean;
};

class DynamicAutocompleteInput extends Component<Props, State> {
  textArea = React.createRef<HTMLTextAreaElement>();
  editor: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      isFocused: false,
      autoCompleteVisible: false,
    };
  }

  componentDidMount(): void {
    if (this.textArea.current) {
      const options: EditorConfiguration = {};
      //use this for lightning menu theme
      if (this.props.theme === "DARK") options.theme = "monokai";
      if (!this.props.input.onChange || this.props.disabled) {
        options.readOnly = true;
        options.scrollbarStyle = "null";
      }
      if (this.props.showLineNumbers) options.lineNumbers = true;
      const extraKeys: Record<string, any> = {
        "Ctrl-Space": "autocomplete",
      };
      if (!this.props.allowTabIndent) extraKeys["Tab"] = false;
      this.editor = CodeMirror.fromTextArea(this.textArea.current, {
        mode: this.props.mode || { name: "javascript", globalVars: true },
        viewportMargin: 10,
        tabSize: 2,
        indentWithTabs: true,
        lineWrapping: !this.props.singleLine,
        showHint: true,
        extraKeys,
        autoCloseBrackets: true,
        ...options,
      });

      this.editor.on("change", _.debounce(this.handleChange, 300));
      this.editor.on("cursorActivity", this.handleAutocompleteVisibility);
      this.editor.on("keyup", this.handleAutocompleteHide);
      this.editor.on("focus", this.handleEditorFocus);
      this.editor.on("blur", this.handleEditorBlur);
      this.editor.setOption("hintOptions", {
        completeSingle: false,
        globalScope: this.props.dynamicData,
      });
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
      }
      this.editor.setValue(inputValue);
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
          this.editor.setOption("hintOptions", {
            completeSingle: false,
            globalScope: this.props.dynamicData,
          });
        }
      }
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
      let cumulativeCharCount = 0;
      parseDynamicString(value).forEach(segment => {
        const start = cumulativeCharCount;
        const dynamicStart = segment.indexOf("{{");
        const dynamicDoesStart = dynamicStart > -1;
        const dynamicEnd = segment.indexOf("}}");
        const dynamicDoesEnd = dynamicEnd > -1;
        const dynamicStartIndex = dynamicStart + start + 1;
        const dynamicEndIndex = dynamicEnd + start + 1;
        if (
          dynamicDoesStart &&
          cursor.ch > dynamicStartIndex &&
          ((dynamicDoesEnd && cursor.ch < dynamicEndIndex) ||
            (!dynamicDoesEnd && cursor.ch > dynamicStartIndex))
        ) {
          cursorBetweenBinding = true;
        }
        cumulativeCharCount = start + segment.length;
      });

      const shouldShow = cursorBetweenBinding && !cm.state.completionActive;

      if (this.props.baseMode) {
        // https://github.com/codemirror/CodeMirror/issues/5249#issue-295565980
        cm.doc.modeOption = this.props.baseMode;
      }

      if (shouldShow) {
        AnalyticsUtil.logEvent("AUTO_COMPELTE_SHOW", {});
        this.setState({
          autoCompleteVisible: true,
        });
        cm.showHint(cm);
      } else {
        this.setState({
          autoCompleteVisible: false,
        });
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

  updatePropertyValue = (value: string, cursor: number) => {
    this.editor.setValue(value);
    this.editor.focus();
    this.editor.setCursor({
      line: 1,
      ch: cursor,
    });
  };

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
    } = this.props;
    const hasError = !!(meta && meta.error);
    let showError = false;
    if (this.editor) {
      showError =
        hasError && this.state.isFocused && !this.state.autoCompleteVisible;
    }
    const themeType = this.props.theme === "DARK" ? "dark" : "light";
    return (
      <DynamicAutocompleteInputWrapper>
        {(showLightningMenu === undefined || showLightningMenu === true) && (
          <LightningMenu
            themeType={themeType}
            updatePropertyValue={this.updatePropertyValue}
          />
        )}
        <ErrorTooltip message={meta ? meta.error : ""} isOpen={showError}>
          <Wrapper
            editorTheme={theme}
            hasError={hasError}
            singleLine={singleLine}
            isFocused={this.state.isFocused}
            disabled={disabled}
            className={className}
            setMaxHeight={setMaxHeight}
          >
            <HintStyles />
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
              <HelperTooltip
                description={this.props.description}
                rightIcon={this.props.rightIcon}
              />
            )}
          </Wrapper>
        </ErrorTooltip>
      </DynamicAutocompleteInputWrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getDataTreeForAutocomplete(state),
});

export default connect(mapStateToProps)(DynamicAutocompleteInput);
