import React, { Component, lazy, Suspense } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import CodeMirror, { EditorConfiguration } from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/duotone-dark.css";
import "codemirror/theme/duotone-light.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/display/placeholder";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/display/autorefresh";
import "codemirror/addon/mode/multiplex";
import "codemirror/addon/tern/tern.css";
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import EvaluatedValuePopup from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { WrappedFieldInputProps } from "redux-form";
import _ from "lodash";
import {
  DataTree,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import { Skin } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";
import "components/editorComponents/CodeEditor/modes";
import {
  CodeEditorBorder,
  EditorConfig,
  EditorModes,
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
import BindingPrompt from "./BindingPrompt";
import { showBindingPrompt } from "./BindingPromptHelper";
import ScrollIndicator from "components/ads/ScrollIndicator";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import * as Sentry from "@sentry/react";
import { getInputValue, removeNewLineChars } from "./codeEditorUtils";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import {
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";

const LightningMenu = lazy(() =>
  retryPromise(() => import("components/editorComponents/LightningMenu")),
);

const AUTOCOMPLETE_CLOSE_KEY_CODES = [
  "Enter",
  "Tab",
  "Escape",
  "Comma",
  "Backspace",
];

interface ReduxStateProps {
  dynamicData: DataTree;
}

export type EditorStyleProps = {
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  height?: string | number;
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
  border?: CodeEditorBorder;
  hoverInteraction?: boolean;
  fill?: boolean;
  useValidationMessage?: boolean;
  evaluationSubstitutionType?: EvaluationSubstitutionType;
};

export type EditorProps = EditorStyleProps &
  EditorConfig & {
    input: Partial<WrappedFieldInputProps>;
  } & {
    additionalDynamicData?: Record<string, Record<string, unknown>>;
    promptMessage?: React.ReactNode | string;
    hideEvaluatedValue?: boolean;
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
  editor!: CodeMirror.Editor;
  hinters: Hinter[] = [];
  private editorWrapperRef = React.createRef<HTMLDivElement>();

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
        matchBrackets: false,
        scrollbarStyle:
          this.props.size !== EditorSize.COMPACT ? "native" : "null",
      };

      if (!this.props.input.onChange || this.props.disabled) {
        options.readOnly = true;
        options.scrollbarStyle = "null";
      }

      options.extraKeys = {};
      if (this.props.tabBehaviour === TabBehaviour.INPUT) {
        options.extraKeys["Tab"] = false;
      }
      if (this.props.folding) {
        options.foldGutter = true;
        options.gutters = ["CodeMirror-linenumbers", "CodeMirror-foldgutter"];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        options.foldOptions = {
          widget: () => {
            return "\u002E\u002E\u002E";
          },
        };
      }
      this.editor = CodeMirror.fromTextArea(this.textArea.current, options);
      this.editor.on("change", _.debounce(this.handleChange, 300));
      this.editor.on("change", this.handleAutocompleteVisibility);
      this.editor.on("change", this.onChangeTrigger);
      this.editor.on("keyup", this.handleAutocompleteHide);
      this.editor.on("focus", this.handleEditorFocus);
      this.editor.on("cursorActivity", this.handleCursorMovement);
      this.editor.on("focus", this.onFocusTrigger);
      this.editor.on("blur", this.handleEditorBlur);
      if (this.props.height) {
        this.editor.setSize(0, this.props.height);
      } else {
        this.editor.setSize(0, "auto");
      }

      // Set value of the editor
      const inputValue = getInputValue(this.props.input.value || "");
      if (this.props.size === EditorSize.COMPACT) {
        this.editor.setValue(removeNewLineChars(inputValue));
      } else {
        this.editor.setValue(inputValue);
      }

      this.updateMarkings();

      this.startAutocomplete();
    }
  }

  componentDidUpdate(prevProps: Props): void {
    this.editor.refresh();
    if (!this.state.isFocused) {
      // const currentMode = this.editor.getOption("mode");
      const editorValue = this.editor.getValue();
      // Safe update of value of the editor when value updated outside the editor
      const inputValue = getInputValue(this.props.input.value);
      if (!!inputValue || inputValue === "") {
        if (this.props.size === EditorSize.COMPACT) {
          this.editor.setValue(removeNewLineChars(inputValue));
        } else if (inputValue !== editorValue) {
          this.editor.setValue(inputValue);
        }
      }
      this.updateMarkings();

      // if (currentMode !== this.props.mode) {
      //   this.editor.setOption("mode", this.props?.mode);
      // }
    } else {
      // Update the dynamic bindings for autocomplete
      if (prevProps.dynamicData !== this.props.dynamicData) {
        this.hinters.forEach(
          (hinter) => hinter.update && hinter.update(this.props.dynamicData),
        );
      }
    }
  }

  startAutocomplete() {
    this.hinters = this.props.hinting.map((helper) => {
      return helper(
        this.editor,
        this.props.dynamicData,
        this.props.additionalDynamicData,
      );
    });
  }

  onFocusTrigger = (cm: CodeMirror.Editor) => {
    if (!cm.state.completionActive) {
      this.hinters.forEach((hinter) => hinter.trigger && hinter.trigger(cm));
    }
  };

  onChangeTrigger = (cm: CodeMirror.Editor) => {
    if (this.state.isFocused) {
      this.hinters.forEach((hinter) => hinter.trigger && hinter.trigger(cm));
    }
  };

  handleCursorMovement = (cm: CodeMirror.Editor) => {
    // ignore if disabled
    if (!this.props.input.onChange || this.props.disabled) {
      return;
    }
    const mode = cm.getModeAt(cm.getCursor());
    if (
      mode &&
      [EditorModes.JAVASCRIPT, EditorModes.JSON].includes(mode.name)
    ) {
      this.editor.setOption("matchBrackets", true);
    } else {
      this.editor.setOption("matchBrackets", false);
    }
  };

  handleEditorFocus = () => {
    if (this.state.isFocused) return;
    this.setState({ isFocused: true });
    this.editor.refresh();
    if (this.props.size === EditorSize.COMPACT) {
      const inputValue = this.props.input.value;
      this.editor.setOption("lineWrapping", true);
      this.editor.setValue(inputValue);
      this.editor.setCursor(inputValue.length);
    }
  };

  handleEditorBlur = (cm: CodeMirror.Editor) => {
    this.handleChange();
    if (!cm.state.completionActive) this.setState({ isFocused: false });
    if (this.props.size === EditorSize.COMPACT) {
      this.editor.setOption("lineWrapping", false);
    }

    this.editor.setOption("matchBrackets", false);
  };

  handleChange = (instance?: any, changeObj?: any) => {
    const value = this.editor.getValue();
    if (changeObj && changeObj.origin === "complete") {
      AnalyticsUtil.logEvent("AUTO_COMPLETE_SELECT", {
        searchString: changeObj.text[0],
      });
    }
    const inputValue = this.props.input.value;
    if (
      this.props.input.onChange &&
      value !== inputValue &&
      this.state.isFocused
    ) {
      this.props.input.onChange(value);
    }
    this.updateMarkings();
  };

  handleAutocompleteVisibility = (cm: CodeMirror.Editor) => {
    const expected = this.props.expected ? this.props.expected : "";
    const { entityName } = getEntityNameAndPropertyPath(
      this.props.dataTreePath || "",
    );
    this.hinters.forEach((hinter) => hinter.showHint(cm, expected, entityName));
  };

  handleAutocompleteHide = (cm: any, event: KeyboardEvent) => {
    if (AUTOCOMPLETE_CLOSE_KEY_CODES.includes(event.code)) {
      cm.closeHint();
    }
  };

  updateMarkings = () => {
    this.props.marking.forEach((helper) => this.editor && helper(this.editor));
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

  getPropertyValidation = (
    dataTree: DataTree,
    dataTreePath?: string,
  ): {
    isInvalid: boolean;
    errors: EvaluationError[];
    pathEvaluatedValue: unknown;
  } => {
    if (!dataTreePath) {
      return {
        isInvalid: false,
        errors: [],
        pathEvaluatedValue: undefined,
      };
    }

    const errors = _.get(
      dataTree,
      getEvalErrorPath(dataTreePath),
      [],
    ) as EvaluationError[];
    const filteredLintErrors = errors.filter(
      (error) => error.errorType !== PropertyEvaluationErrorType.LINT,
    );
    const pathEvaluatedValue = _.get(dataTree, getEvalValuePath(dataTreePath));

    return {
      isInvalid: filteredLintErrors.length > 0,
      errors: filteredLintErrors,
      pathEvaluatedValue,
    };
  };

  render() {
    const {
      border,
      borderLess,
      className,
      dataTreePath,
      disabled,
      dynamicData,
      evaluatedValue,
      evaluationSubstitutionType,
      expected,
      fill,
      height,
      hideEvaluatedValue,
      hoverInteraction,
      input,
      placeholder,
      showLightningMenu,
      size,
      theme,
      useValidationMessage,
    } = this.props;
    const {
      errors,
      isInvalid,
      pathEvaluatedValue,
    } = this.getPropertyValidation(dynamicData, dataTreePath);
    let evaluated = evaluatedValue;
    if (dataTreePath) {
      evaluated = pathEvaluatedValue;
    }

    const showEvaluatedValue =
      this.state.isFocused &&
      ("evaluatedValue" in this.props ||
        ("dataTreePath" in this.props && !!this.props.dataTreePath));

    return (
      <DynamicAutocompleteInputWrapper
        isActive={(this.state.isFocused && !isInvalid) || this.state.isOpened}
        isError={isInvalid}
        isNotHover={this.state.isFocused || this.state.isOpened}
        skin={this.props.theme === EditorTheme.DARK ? Skin.DARK : Skin.LIGHT}
        theme={this.props.theme}
      >
        {showLightningMenu !== false && !this.state.isFocused && (
          <Suspense fallback={<div />}>
            <LightningMenu
              isFocused={this.state.isFocused}
              isOpened={this.state.isOpened}
              onCloseLightningMenu={() => {
                this.setState({ isOpened: false });
              }}
              onOpenLightningMenu={() => {
                this.setState({ isOpened: true });
              }}
              skin={
                this.props.theme === EditorTheme.DARK ? Skin.DARK : Skin.LIGHT
              }
              updateDynamicInputValue={this.updatePropertyValue}
            />
          </Suspense>
        )}
        <EvaluatedValuePopup
          errors={errors}
          evaluatedValue={evaluated}
          evaluationSubstitutionType={evaluationSubstitutionType}
          expected={expected}
          hasError={isInvalid}
          hideEvaluatedValue={hideEvaluatedValue}
          isOpen={showEvaluatedValue}
          theme={theme || EditorTheme.LIGHT}
          useValidationMessage={useValidationMessage}
        >
          <EditorWrapper
            border={border}
            borderLess={borderLess}
            className={className}
            disabled={disabled}
            editorTheme={this.props.theme}
            fill={fill}
            hasError={isInvalid}
            height={height}
            hoverInteraction={hoverInteraction}
            isFocused={this.state.isFocused}
            isNotHover={this.state.isFocused || this.state.isOpened}
            ref={this.editorWrapperRef}
            size={size}
          >
            <HintStyles editorTheme={theme || EditorTheme.LIGHT} />
            {this.props.leftIcon && (
              <IconContainer>{this.props.leftIcon}</IconContainer>
            )}

            {this.props.leftImage && (
              <img
                alt="img"
                className="leftImageStyles"
                src={this.props.leftImage}
              />
            )}
            <textarea
              ref={this.textArea}
              {..._.omit(this.props.input, ["onChange", "value"])}
              defaultValue={input.value}
              placeholder={placeholder}
            />
            {this.props.link && (
              <a
                className="linkStyles"
                href={this.props.link}
                rel="noopener noreferrer"
                target="_blank"
              >
                API documentation
              </a>
            )}
            {this.props.rightIcon && (
              <IconContainer>{this.props.rightIcon}</IconContainer>
            )}
            <BindingPrompt
              editorTheme={this.props.theme}
              isOpen={showBindingPrompt(showEvaluatedValue, input.value)}
              promptMessage={this.props.promptMessage}
            />
            <ScrollIndicator containerRef={this.editorWrapperRef} />
          </EditorWrapper>
        </EvaluatedValuePopup>
      </DynamicAutocompleteInputWrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getDataTreeForAutocomplete(state),
});

export default Sentry.withProfiler(connect(mapStateToProps)(CodeEditor));
