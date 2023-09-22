import React, { createRef, useEffect } from "react";
import {
  Button,
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  SegmentedControl,
} from "design-system";
import type { EditorConfiguration } from "codemirror";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import CodeMirror from "codemirror";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import styled from "styled-components";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";

function Editor(props: any) {
  const target = createRef<HTMLDivElement>();
  let editor: any;

  useEffect(() => {
    const options: EditorConfiguration = {
      autoRefresh: true,
      mode: props.mode,
      viewportMargin: 10,
      tabSize: 2,
      autoCloseBrackets: true,
      indentWithTabs: true,
      lineWrapping: true,
      lineNumbers: true,
      addModeClass: true,
      matchBrackets: false,
      scrollbarStyle: "native",
      tabindex: -1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      configureMouse: () => {
        return {
          addNew: false,
        };
      },
    };

    const gutters = new Set<string>();

    gutters.add("CodeMirror-linenumbers");
    gutters.add("CodeMirror-foldgutter");

    options.foldGutter = true;

    options.gutters = Array.from(gutters);

    options.value = props.value;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editor = CodeMirror(target.current, options);

    editor.setSize("100%", props.height);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editor.on("change", (value) => {
      props.onChange(value.getValue());
    });
  }, []);

  useEffect(() => {
    editor?.setValue(props.value);
  }, [props.value]);

  return (
    <div style={{ padding: "0 10px" }}>
      <div>{props.label}</div>
      <div ref={target} style={{ border: "1px solid #000" }} />
    </div>
  );
}

export type HTMLDocumentBuidlerControlProps = ControlProps & {
  propertyList: string;
  generateProperty: (property: string) => ControlProps;
  srcDoc: {
    html: string;
    css: string;
    js: string;
  };
};

const StyledModalBody = styled(ModalBody)`
  height: 100px;

  .editor {
    height: 360px;
  }
`;

class HTMLDocumentBuidlerControl extends BaseControl<
  HTMLDocumentBuidlerControlProps,
  {
    mode?: string;
    srcDoc?: {
      html?: string;
      css?: string;
      js?: string;
    };
  }
> {
  state = {
    open: false,
    mode: "simple",
    srcDoc: {
      html: "",
      css: "",
      js: "",
    },
  };

  onModalOpen() {
    this.setState({
      mode:
        !!this.props.widgetProperties.srcDoc.css ||
        !!this.props.widgetProperties.srcDoc.js
          ? "advanced"
          : "simple",
      srcDoc: {
        html: this.props.widgetProperties.srcDoc.html,
        css: this.props.widgetProperties.srcDoc.css,
        js: this.props.widgetProperties.srcDoc.js,
      },
    });
  }

  render() {
    return (
      <Modal
        onOpenChange={() => {
          this.onModalOpen();
        }}
        open={this.state.open}
      >
        <ModalTrigger>
          <Button
            kind="secondary"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onClick={() => this.setState({ open: true })}
            size="sm"
          >
            configure
          </Button>
        </ModalTrigger>
        <ModalContent>
          <ModalHeader>{this.props.propertyName}</ModalHeader>
          <StyledModalBody>
            <div
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              style={{
                display: "flex",
                "justify-content": "center",
                "margin-bottom": "30px",
              }}
            >
              <SegmentedControl
                defaultValue={this.state.mode}
                isFullWidth={false}
                onChange={(value) => {
                  this.setState({
                    mode: value,
                  });

                  if (value === "simple") {
                    this.setState({
                      srcDoc: {
                        html: `${this.state.srcDoc.html}
<script>
  ${this.state.srcDoc.js}
<script>
<style>
  ${this.state.srcDoc.css}
<style>
`,
                        js: "",
                        css: "",
                      },
                    });
                  }
                }}
                options={[
                  {
                    label: "Simple",
                    value: "simple",
                  },
                  {
                    label: "Advanced",
                    value: "advanced",
                  },
                ]}
              />
            </div>
            <div className="editor">
              {this.state.mode === "simple" ? (
                <Editor
                  height="300"
                  label="HTML"
                  mode="htmlmixed"
                  onChange={(value: string) =>
                    this.setState({
                      srcDoc: { ...this.state.srcDoc, html: value },
                    })
                  }
                  value={this.state.srcDoc.html}
                  width="500"
                />
              ) : (
                <div style={{ display: "flex" }}>
                  <div style={{ height: "354px", width: "50%" }}>
                    <Editor
                      height="330"
                      label="JS"
                      mode={EditorModes.JAVASCRIPT}
                      onChange={(value: string) =>
                        this.setState({
                          srcDoc: { ...this.state.srcDoc, js: value },
                        })
                      }
                      value={this.state.srcDoc.js}
                      width="250"
                    />
                  </div>
                  <div style={{ width: "50%" }}>
                    <div style={{ height: "180px" }}>
                      <Editor
                        height="150"
                        label="HTML"
                        mode="htmlmixed"
                        onChange={(value: string) =>
                          this.setState({
                            srcDoc: { ...this.state.srcDoc, html: value },
                          })
                        }
                        value={this.state.srcDoc.html}
                        width="250"
                      />
                    </div>
                    <div style={{ height: "180px" }}>
                      <Editor
                        height="150"
                        label="css"
                        mode="css"
                        onChange={(value: string) =>
                          this.setState({
                            srcDoc: { ...this.state.srcDoc, css: value },
                          })
                        }
                        value={this.state.srcDoc.css}
                        width="250"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </StyledModalBody>
          <ModalFooter>
            <Button
              kind="secondary"
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              onClick={() => this.setState({ open: false })}
              size="md"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.updateProperty(
                  this.props.propertyName,
                  this.state.srcDoc,
                  true,
                );
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.setState({ open: false });
              }}
              size="md"
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  static getControlType() {
    return "HTML_DOCUMENT_BUILDER";
  }
}

export default HTMLDocumentBuidlerControl;
