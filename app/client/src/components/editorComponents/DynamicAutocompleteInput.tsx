import React, { Component } from "react";
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
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import _ from "lodash";
import { parseDynamicString } from "utils/DynamicBindingUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
require("codemirror/mode/javascript/javascript");

const HintStyles = createGlobalStyle`
  .CodeMirror-hints {
    position: absolute;
    z-index: 10;
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
  borderStyle?: THEME;
  hasError: boolean;
}>`
  border: 1px solid;
  border-color: ${props =>
    props.hasError
      ? props.theme.colors.error
      : props.borderStyle !== THEMES.DARK
      ? "#d0d7dd"
      : "transparent"};
  border-radius: 4px;
  display: flex;
  flex: 1;
  flex-direction: row;
  position: relative;
  text-transform: none;
  min-height: 32px;
  overflow: hidden;
  height: auto;
  && {
    .binding-highlight {
      color: ${props =>
        props.borderStyle === THEMES.DARK ? "#f7c75b" : "#ffb100"};
      font-weight: 700;
    }
    .CodeMirror {
      flex: 1;
      line-height: 21px;
      z-index: 0;
      border-radius: 4px;
      height: auto;
    }
    .CodeMirror pre.CodeMirror-placeholder {
      color: #a3b3bf;
    }
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
`;

const THEMES = {
  LIGHT: "LIGHT",
  DARK: "DARK",
};

type THEME = "LIGHT" | "DARK";

interface ReduxStateProps {
  dynamicData: DataTree;
}

export type DynamicAutocompleteInputProps = {
  placeholder?: string;
  leftIcon?: Function;
  height?: number;
  theme?: THEME;
  meta?: Partial<WrappedFieldMetaProps>;
  showLineNumbers?: boolean;
  allowTabIndent?: boolean;
};

type Props = ReduxStateProps &
  DynamicAutocompleteInputProps & {
    input: Partial<WrappedFieldInputProps>;
  };

type State = {
  isFocused: boolean;
};

class DynamicAutocompleteInput extends Component<Props, State> {
  textArea = React.createRef<HTMLTextAreaElement>();
  editor: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      isFocused: false,
    };
  }

  componentDidMount(): void {
    if (this.textArea.current) {
      const options: EditorConfiguration = {};
      if (this.props.theme === "DARK") options.theme = "monokai";
      if (!this.props.input.onChange) options.readOnly = true;
      if (this.props.showLineNumbers) options.lineNumbers = true;
      const extraKeys: Record<string, any> = {
        "Ctrl-Space": "autocomplete",
      };
      if (!this.props.allowTabIndent) extraKeys["Tab"] = false;
      this.editor = CodeMirror.fromTextArea(this.textArea.current, {
        mode: { name: "javascript", globalVars: true },
        viewportMargin: 10,
        tabSize: 2,
        indentWithTabs: true,
        lineWrapping: true,
        showHint: true,
        extraKeys,
        autoCloseBrackets: true,
        ...options,
      });
      this.editor.on("change", _.debounce(this.handleChange, 300));
      this.editor.on("cursorActivity", this.handleAutocompleteVisibility);
      this.editor.on("focus", () => this.setState({ isFocused: true }));
      this.editor.on("blur", () => this.setState({ isFocused: false }));
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
      const editorValue = this.editor.getValue();
      let inputValue = this.props.input.value;
      // Safe update of value of the editor when value updated outside the editor
      if (typeof inputValue === "object") {
        inputValue = JSON.stringify(inputValue, null, 2);
      }
      if ((!!inputValue || inputValue === "") && inputValue !== editorValue) {
        const cursor = this.editor.getCursor();
        this.editor.setValue(inputValue);
        this.editor.setCursor(cursor);
      }
      // Update the dynamic bindings for autocomplete
      if (prevProps.dynamicData !== this.props.dynamicData) {
        this.editor.setOption("hintOptions", {
          completeSingle: false,
          globalScope: this.props.dynamicData,
        });
      }
    }
  }

  handleChange = () => {
    const value = this.editor.getValue();
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
      if (shouldShow) {
        cm.showHint(cm);
      }
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

  render() {
    const { input, meta, theme } = this.props;
    const hasError = !!(meta && meta.error);
    let showError = false;
    if (this.editor) {
      showError = hasError && this.state.isFocused;
    }
    return (
      <ErrorTooltip message={meta ? meta.error : ""} isOpen={showError}>
        <Wrapper borderStyle={theme} hasError={hasError}>
          <HintStyles />
          <IconContainer>
            {this.props.leftIcon && <this.props.leftIcon />}
          </IconContainer>
          <textarea
            ref={this.textArea}
            {..._.omit(this.props.input, ["onChange", "value"])}
            defaultValue={input.value}
            placeholder={this.props.placeholder}
          />
        </Wrapper>
      </ErrorTooltip>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getDataTreeForAutocomplete(state),
});

export default connect(mapStateToProps)(DynamicAutocompleteInput);
