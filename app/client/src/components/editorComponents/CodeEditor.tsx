import React, { ChangeEvent } from "react";
import cm from "codemirror";
import styled from "styled-components";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";

require("codemirror/mode/javascript/javascript");

const Wrapper = styled.div<{ height: number | string }>`
  height: ${props =>
    typeof props.height === "number" ? props.height + "px" : props.height};
  color: white;
  .CodeMirror {
    height: 100%;
  }
`;

interface Props {
  input: {
    value: string;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };
  height: number | string;
}

class CodeEditor extends React.Component<Props> {
  textArea = React.createRef<HTMLTextAreaElement>();
  editor: any;
  componentDidMount(): void {
    if (this.textArea.current) {
      const readOnly = !this.props.input.onChange;

      this.editor = cm.fromTextArea(this.textArea.current, {
        mode: { name: "javascript", json: true },
        value: this.props.input.value,
        readOnly,
        tabSize: 2,
        indentWithTabs: true,
        lineNumbers: true,
        lineWrapping: true,
      });
    }
  }

  componentDidUpdate(
    prevProps: Readonly<Props>,
    prevState: Readonly<{}>,
    snapshot?: any,
  ): void {
    this.editor.setValue(this.props.input.value);
  }

  render(): React.ReactNode {
    return (
      <Wrapper height={this.props.height}>
        <textarea
          ref={this.textArea}
          onChange={this.props.input.onChange}
          defaultValue={this.props.input.value}
        />
      </Wrapper>
    );
  }
}

export default CodeEditor;
