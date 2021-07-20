import React, { Component } from "react";
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
  ENTITY_TYPE,
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
  HintEntityInformation,
  Hinter,
  HintHelper,
  MarkHelper,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  DynamicAutocompleteInputWrapper,
  EditorWrapper,
  IconContainer,
} from "components/editorComponents/CodeEditor/styledComponents";
import { bindingMarker } from "components/editorComponents/CodeEditor/markHelpers";
import { bindingHint } from "components/editorComponents/CodeEditor/hintHelpers";
import BindingPrompt from "./BindingPrompt";
import { showBindingPrompt } from "./BindingPromptHelper";
import ScrollIndicator from "components/ads/ScrollIndicator";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import * as Sentry from "@sentry/react";
import {
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { getInputValue, removeNewLineChars } from "./codeEditorUtils";
import { commandsHelper } from "./commandsHelper";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import Button from "components/ads/Button";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { getPluginIdToImageLocation } from "sagas/selectors";

const AUTOCOMPLETE_CLOSE_KEY_CODES = [
  "Enter",
  "Tab",
  "Escape",
  "Comma",
  "Backspace",
];

interface ReduxStateProps {
  dynamicData: DataTree;
  datasources: any;
  pluginIdToImageLocation: Record<string, string>;
  recentEntities: string[];
}

interface ReduxDispatchProps {
  executeCommand: (payload: any) => void;
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

type Props = ReduxStateProps &
  EditorProps &
  ReduxDispatchProps & { dispatch?: () => void };

type State = {
  isFocused: boolean;
  isOpened: boolean;
  autoCompleteVisible: boolean;
  hinterOpen: boolean;
};

const CommandBtnContainer = styled.div<{ isFocused: boolean }>`
  position: absolute;
  right: 1px;
  height: 33px;
  width: 33px;
  top: 1px;
  display: none;
  transition: 0.3s all ease;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.isFocused ? Colors.MERCURY : "#fafafa")};
  z-index: 2;
`;
class CodeEditor extends Component<Props, State> {
  static defaultProps = {
    marking: [bindingMarker],
    hinting: [bindingHint, commandsHelper],
  };

  codeEditorTarget = React.createRef<HTMLDivElement>();
  editor!: CodeMirror.Editor;
  hinters: Hinter[] = [];
  private editorWrapperRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      isFocused: false,
      isOpened: false,
      autoCompleteVisible: false,
      hinterOpen: false,
    };
    this.updatePropertyValue = this.updatePropertyValue.bind(this);
  }

  componentDidMount(): void {
    if (this.codeEditorTarget.current) {
      const options: EditorConfiguration = {
        mode: this.props.mode,
        theme: EditorThemes[this.props.theme],
        viewportMargin: 10,
        tabSize: 2,
        autoCloseBrackets: true,
        indentWithTabs: this.props.tabBehaviour === TabBehaviour.INDENT,
        lineWrapping: true,
        lineNumbers: this.props.showLineNumbers,
        addModeClass: true,
        matchBrackets: false,
        scrollbarStyle:
          this.props.size !== EditorSize.COMPACT ? "native" : "null",
        placeholder: this.props.placeholder,
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

      // Set value of the editor
      const inputValue = getInputValue(this.props.input.value || "");
      if (this.props.size === EditorSize.COMPACT) {
        options.value = removeNewLineChars(inputValue);
      } else {
        options.value = inputValue;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore This is an undocumented option of codemirror available
      // with the Codemirror Constructor
      options.finishInit = (editor: CodeMirror.Editor) => {
        // If you need to do something with the editor right after it’s been created,
        // put that code here.
        //
        // This helps with performance: finishInit() is called inside
        // CodeMirror’s `operation()` (https://codemirror.net/doc/manual.html#operation
        // which means CodeMirror recalculates itself only one time, once all CodeMirror
        // changes here are completed
        //

        editor.on("beforeChange", this.handleBeforeChange);
        editor.on("change", _.debounce(this.handleChange, 1000));
        editor.on("change", this.handleAutocompleteVisibility);
        editor.on("change", this.onChangeTrigger);
        editor.on("keyup", this.handleAutocompleteHide);
        editor.on("focus", this.handleEditorFocus);
        editor.on("cursorActivity", this.handleCursorMovement);
        editor.on("focus", this.onFocusTrigger);
        editor.on("blur", this.handleEditorBlur);
        editor.on("postPick", () => this.handleAutocompleteVisibility(editor));
        if (this.props.height) {
          editor.setSize("100%", this.props.height);
        } else {
          editor.setSize("100%", "100%");
        }

        CodeEditor.updateMarkings(editor, this.props.marking);

        this.hinters = CodeEditor.startAutocomplete(
          editor,
          this.props.hinting,
          this.props.dynamicData,
          this.props.showLightningMenu,
          this.props.additionalDynamicData,
        );
      };

      // Finally create the Codemirror editor
      this.editor = CodeMirror(this.codeEditorTarget.current, options);
      // DO NOT ADD CODE BELOW. If you need to do something with the editor right after it’s created,
      // put that code into `options.finishInit()`.
    }
  }

  componentDidUpdate(prevProps: Props): void {
    this.editor.operation(() => {
      if (!this.state.isFocused) {
        // const currentMode = this.editor.getOption("mode");
        const editorValue = this.editor.getValue();
        // Safe update of value of the editor when value updated outside the editor
        const inputValue = getInputValue(this.props.input.value);
        if (!!inputValue || inputValue === "") {
          if (inputValue !== editorValue) {
            this.editor.setValue(inputValue);
          }
        }
        CodeEditor.updateMarkings(this.editor, this.props.marking);
      } else {
        // Update the dynamic bindings for autocomplete
        if (prevProps.dynamicData !== this.props.dynamicData) {
          this.hinters.forEach(
            (hinter) => hinter.update && hinter.update(this.props.dynamicData),
          );
        }
      }
    });
  }

  componentWillUnmount() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: No types available
    this.editor.closeHint();
  }

  static startAutocomplete(
    editor: CodeMirror.Editor,
    hinting: Array<HintHelper>,
    dynamicData: DataTree,
    showLightningMenu?: boolean,
    additionalDynamicData?: Record<string, Record<string, unknown>>,
  ) {
    return hinting.map((helper) => {
      return helper(editor, dynamicData, additionalDynamicData);
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
    this.setState({ isFocused: true });
    if (this.editor.getValue().length === 0)
      this.handleAutocompleteVisibility(this.editor);
  };

  handleEditorBlur = () => {
    this.handleChange();
    this.setState({ isFocused: false });
    this.editor.setOption("matchBrackets", false);
  };

  handleBeforeChange(
    cm: CodeMirror.Editor,
    change: CodeMirror.EditorChangeCancellable,
  ) {
    if (change.origin === "paste") {
      // Remove all non ASCII quotes since they are invalid in Javascript
      const formattedText = change.text.map((line) => {
        let formattedLine = line.replace(/[‘’]/g, "'");
        formattedLine = formattedLine.replace(/[“”]/g, '"');
        return formattedLine;
      });
      if (change.update) {
        change.update(undefined, undefined, formattedText);
      }
    }
  }

  handleChange = (instance?: any, changeObj?: any) => {
    const value = this.editor.getValue() || "";
    if (changeObj && changeObj.origin === "complete") {
      AnalyticsUtil.logEvent("AUTO_COMPLETE_SELECT", {
        searchString: changeObj.text[0],
      });
    }
    const inputValue = this.props.input.value || "";
    if (
      this.props.input.onChange &&
      (value !== inputValue ||
        _.get(this.editor, "state.completionActive.startLen") === 0) &&
      this.state.isFocused
    ) {
      this.props.input.onChange(value);
    }
    CodeEditor.updateMarkings(this.editor, this.props.marking);
  };

  handleAutocompleteVisibility = (cm: CodeMirror.Editor) => {
    if (!this.state.isFocused) return;
    const { dataTreePath, dynamicData, expected } = this.props;
    const entityInformation: HintEntityInformation = {
      expectedType: expected,
    };
    if (dataTreePath) {
      const { entityName } = getEntityNameAndPropertyPath(dataTreePath);
      entityInformation.entityName = entityName;
      const entity = dynamicData[entityName];
      if (entity && "ENTITY_TYPE" in entity) {
        const entityType = entity.ENTITY_TYPE;
        if (
          entityType === ENTITY_TYPE.WIDGET ||
          entityType === ENTITY_TYPE.ACTION
        ) {
          entityInformation.entityType = entityType;
        }
      }
    }
    let hinterOpen = false;
    for (let i = 0; i < this.hinters.length; i++) {
      hinterOpen = this.hinters[i].showHint(cm, entityInformation, {
        datasources: this.props.datasources.list,
        pluginIdToImageLocation: this.props.pluginIdToImageLocation,
        recentEntities: this.props.recentEntities,
        update: this.props.input.onChange?.bind(this),
        executeCommand: (payload: any) => {
          this.props.executeCommand({
            ...payload,
            callback: (binding: string) => {
              const value = this.editor.getValue() + binding;
              this.updatePropertyValue(value, value.length);
            },
          });
        },
      });
      if (hinterOpen) break;
    }
    this.setState({ hinterOpen });
  };

  handleAutocompleteHide = (cm: any, event: KeyboardEvent) => {
    if (AUTOCOMPLETE_CLOSE_KEY_CODES.includes(event.code)) {
      cm.closeHint();
    }
  };

  static updateMarkings = (
    editor: CodeMirror.Editor,
    marking: Array<MarkHelper>,
  ) => {
    marking.forEach((helper) => helper(editor));
  };

  updatePropertyValue(
    value: string,
    cursor?: number,
    preventAutoComplete = false,
  ) {
    this.editor.focus();
    if (value) {
      this.editor.setValue(value);
    }
    this.editor.setCursor({
      line: cursor || this.editor.lineCount() - 1,
      ch: this.editor.getLine(this.editor.lineCount() - 1).length - 2,
    });
    this.setState({ isFocused: true }, () => {
      if (preventAutoComplete) return;
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
          <CommandBtnContainer
            className="slash-commands"
            isFocused={this.state.isFocused}
          >
            <Button
              className="commands-button"
              onClick={() => {
                const newValue =
                  typeof this.props.input.value === "string"
                    ? this.props.input.value + "/"
                    : "/";
                this.updatePropertyValue(newValue, newValue.length);
              }}
              tag="button"
              text="/"
            />
          </CommandBtnContainer>
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
            <div className="CodeEditorTarget" ref={this.codeEditorTarget}>
              <BindingPrompt
                editorTheme={this.props.theme}
                isOpen={
                  showBindingPrompt(
                    showEvaluatedValue,
                    input.value,
                    this.state.hinterOpen,
                  ) && !_.get(this.editor, "state.completionActive")
                }
                promptMessage={this.props.promptMessage}
                showLightningMenu={this.props.showLightningMenu}
              />
            </div>
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
            <ScrollIndicator containerRef={this.editorWrapperRef} />
          </EditorWrapper>
        </EvaluatedValuePopup>
      </DynamicAutocompleteInputWrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  dynamicData: getDataTreeForAutocomplete(state),
  datasources: state.entities.datasources,
  pluginIdToImageLocation: getPluginIdToImageLocation(state),
  recentEntities: state.ui.globalSearch.recentEntities.map((r) => r.id),
});

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  executeCommand: (payload) => dispatch({ type: "EXECUTE_COMMAND", payload }),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(CodeEditor),
);
