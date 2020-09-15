import React, { Component, lazy, Suspense } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import CodeMirror, { EditorConfiguration } from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/duotone-dark.css";
import "codemirror/theme/duotone-light.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/display/placeholder";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/display/autorefresh";
import "codemirror/addon/mode/multiplex";
import "codemirror/addon/tern/tern.css";
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import EvaluatedValuePopup from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import _ from "lodash";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { Skin } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";
import "components/editorComponents/CodeEditor/modes";
import {
  EditorConfig,
  EditorSize,
  EditorTheme,
  EditorThemes,
  Hinter,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  DynamicAutocompleteInputWrapper,
  EditorWrapper,
  HintStyles,
  IconContainer,
} from "components/editorComponents/CodeEditor/styledComponents";
import { bindingMarker } from "components/editorComponents/CodeEditor/markHelpers";
import { bindingHint } from "components/editorComponents/CodeEditor/hintHelpers";
import { retryPromise } from "utils/AppsmithUtils";

const LightningMenu = lazy(() =>
  retryPromise(() => import("components/editorComponents/LightningMenu")),
);

const AUTOCOMPLETE_CLOSE_KEY_CODES = [
  "Enter",
  "Tab",
  "Escape",
  "Backspace",
  "Comma",
];

interface ReduxStateProps {
  dynamicData: DataTree;
}

export type EditorStyleProps = {
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  height?: string | number;
  meta?: Partial<WrappedFieldMetaProps>;
  showLineNumbers?: boolean;
  className?: string;
  leftImage?: string;
  disabled?: boolean;
  link?: string;
  showLightningMenu?: boolean;
  dataTreePath?: string;
  evaluatedValue?: any;
  expected?: string;
  borderLess?: boolean;
};

export type EditorProps = EditorStyleProps &
  EditorConfig & {
    input: Partial<WrappedFieldInputProps>;
  };

type Props = ReduxStateProps & EditorProps;

type State = {
  isFocused: boolean;
  isOpened: boolean;
  autoCompleteVisible: boolean;
};

class CodeEditor extends Component<Props, State> {
  static defaultProps = {
    marking: [bindingMarker],
    hinting: [bindingHint],
  };

  textArea = React.createRef<HTMLTextAreaElement>();
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  editor: CodeMirror.Editor;
  hinters: Hinter[] = [];

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
      const options: EditorConfiguration = {
        mode: this.props.mode,
        theme: EditorThemes[this.props.theme],
        viewportMargin: 10,
        tabSize: 2,
        autoCloseBrackets: true,
        indentWithTabs: this.props.tabBehaviour === TabBehaviour.INDENT,
        lineWrapping: this.props.size !== EditorSize.COMPACT,
        lineNumbers: this.props.showLineNumbers,
        addModeClass: true,
      };

      if (!this.props.input.onChange || this.props.disabled) {
        options.readOnly = true;
        options.scrollbarStyle = "null";
      }

      options.extraKeys = {};
      if (this.props.tabBehaviour === TabBehaviour.INPUT) {
        options.extraKeys["Tab"] = false;
      }
      this.editor = CodeMirror.fromTextArea(this.textArea.current, options);

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
      this.updateMarkings();

      this.startAutocomplete();
    }
  }

  componentDidUpdate(prevProps: Props): void {
    this.editor.refresh();
    if (!this.state.isFocused) {
      // const currentMode = this.editor.getOption("mode");
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
      this.updateMarkings();

      // if (currentMode !== this.props.mode) {
      //   this.editor.setOption("mode", this.props?.mode);
      // }
    } else {
      // Update the dynamic bindings for autocomplete
      if (prevProps.dynamicData !== this.props.dynamicData) {
        this.hinters.forEach(
          hinter => hinter.update && hinter.update(this.props.dynamicData),
        );
      }
    }
  }

  startAutocomplete() {
    this.hinters = this.props.hinting.map(helper => {
      return helper(this.editor, this.props.dynamicData);
    });
  }

  handleEditorFocus = () => {
    this.setState({ isFocused: true });
    this.editor.refresh();
    if (this.props.size === EditorSize.COMPACT) {
      this.editor.setOption("lineWrapping", true);
    }
  };

  handleEditorBlur = () => {
    this.handleChange();
    this.setState({ isFocused: false });
    if (this.props.size === EditorSize.COMPACT) {
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
    this.updateMarkings();
  };

  handleAutocompleteVisibility = (cm: CodeMirror.Editor) => {
    this.hinters.forEach(hinter => hinter.showHint(cm));
  };

  handleAutocompleteHide = (cm: any, event: KeyboardEvent) => {
    if (AUTOCOMPLETE_CLOSE_KEY_CODES.includes(event.code)) {
      cm.closeHint();
    }
  };

  updateMarkings = () => {
    this.props.marking.forEach(helper => this.editor && helper(this.editor));
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
      disabled,
      className,
      showLightningMenu,
      dataTreePath,
      dynamicData,
      expected,
      size,
      evaluatedValue,
      height,
      borderLess,
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
        skin={this.props.theme === EditorTheme.DARK ? Skin.DARK : Skin.LIGHT}
        isError={hasError}
        isActive={(this.state.isFocused && !hasError) || this.state.isOpened}
        isNotHover={this.state.isFocused || this.state.isOpened}
      >
        {showLightningMenu !== false && (
          <Suspense fallback={<div />}>
            <LightningMenu
              skin={
                this.props.theme === EditorTheme.DARK ? Skin.DARK : Skin.LIGHT
              }
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
          theme={theme || EditorTheme.LIGHT}
          isOpen={showEvaluatedValue}
          evaluatedValue={evaluated}
          expected={expected}
          hasError={hasError}
        >
          <EditorWrapper
            editorTheme={theme}
            hasError={hasError}
            size={size}
            isFocused={this.state.isFocused}
            disabled={disabled}
            className={className}
            height={height}
            borderLess={borderLess}
          >
            <HintStyles editorTheme={theme || EditorTheme.LIGHT} />
            {this.props.leftIcon && (
              <IconContainer>{this.props.leftIcon}</IconContainer>
            )}

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
              <IconContainer>{this.props.rightIcon}</IconContainer>
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

export default connect(mapStateToProps)(CodeEditor);
