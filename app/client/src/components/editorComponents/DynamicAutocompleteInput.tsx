import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import CodeMirror, { EditorConfiguration } from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/javascript-hint";
import {
  getNameBindingsWithData,
  NameBindingsWithData,
} from "selectors/nameBindingsWithDataSelector";
require("codemirror/mode/javascript/javascript");

const Wrapper = styled.div<{ height?: number; theme?: "LIGHT" | "DARK" }>`
  border: ${props => props.theme !== "DARK" && "1px solid #d0d7dd"};
  border-radius: 4px;
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;
  text-transform: none;
  min-height: 32px;
  height: ${props => (props.height ? `${props.height}px` : "32px")};
`;

interface ReduxStateProps {
  dynamicData: NameBindingsWithData;
}

type Props = ReduxStateProps & {
  input: {
    value: string;
    onChange?: (value: string) => void;
  };
  theme?: "LIGHT" | "DARK";
};

class DynamicAutocompleteInput extends Component<Props> {
  textArea = React.createRef<HTMLTextAreaElement>();
  editor: any;

  componentDidMount(): void {
    if (this.textArea.current) {
      const options: EditorConfiguration = {};
      if (this.props.theme === "DARK") options.theme = "monokai";
      if (!this.props.input.onChange) options.readOnly = true;
      this.editor = CodeMirror.fromTextArea(this.textArea.current, {
        mode: { name: "javascript", globalVars: true },
        value: this.props.input.value,
        tabSize: 2,
        indentWithTabs: true,
        lineWrapping: true,
        extraKeys: { "Ctrl-Space": "autocomplete" },
        showHint: true,
        ...options,
      });
      this.editor.on("change", this.handleChange);
      this.editor.on("keyup", this.handleAutocompleteVisibility);
      this.editor.setOption("hintOptions", {
        completeSingle: false,
        globalScope: this.props.dynamicData,
      });
    }
  }

  componentDidUpdate(): void {
    if (this.editor) {
      const editorValue = this.editor.getValue();
      const inputValue = this.props.input.value;
      if (inputValue && inputValue !== editorValue) {
        this.editor.setValue(inputValue);
      }
    }
  }

  handleChange = () => {
    const value = this.editor.getValue();
    if (this.props.input.onChange) {
      this.props.input.onChange(value);
    }
  };

  handleAutocompleteVisibility = (cm: any, event: any) => {
    if (!cm.state.completionActive && event.keyCode !== 13) {
      cm.showHint(cm);
    }
  };

  render() {
    const { input, theme } = this.props;
    const height = this.editor ? this.editor.doc.height + 20 : null;
    return (
      <Wrapper height={height} theme={theme}>
        <textarea ref={this.textArea} defaultValue={input.value} />
      </Wrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getNameBindingsWithData(state),
});

export default connect(mapStateToProps)(DynamicAutocompleteInput);
