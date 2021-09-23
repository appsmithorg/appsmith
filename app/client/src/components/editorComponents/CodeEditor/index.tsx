import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import CodeMirror, {
  Annotation,
  EditorConfiguration,
  UpdateLintingCallback,
} from "codemirror";
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
import "codemirror/addon/lint/lint";
import "codemirror/addon/lint/lint.css";

import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import EvaluatedValuePopup from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { WrappedFieldInputProps } from "redux-form";
import _, { isString } from "lodash";
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
  FieldEntityInformation,
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
import {
  getInputValue,
  isActionEntity,
  isWidgetEntity,
  removeNewLineChars,
} from "./codeEditorUtils";
import { commandsHelper } from "./commandsHelper";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import Button from "components/ads/Button";
import { getPluginIdToImageLocation } from "sagas/selectors";
import { ExpectedValueExample } from "utils/validation/common";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { Placement } from "@blueprintjs/popover2";
import { getLintAnnotations } from "./lintHelpers";
import getFeatureFlags from "utils/featureFlags";
import { executeCommandAction } from "actions/apiPaneActions";
import { SlashCommandPayload } from "entities/Action";
import { Indices } from "constants/Layers";

const AUTOCOMPLETE_CLOSE_KEY_CODES = [
  "Enter",
  "Tab",
  "Escape",
  "Comma",
  "Backspace",
  "Semicolon",
  "Space",
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

export type CodeEditorExpected = {
  type: string;
  example: ExpectedValueExample;
  autocompleteDataType: AutocompleteDataType;
};

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
  expected?: CodeEditorExpected;
  borderLess?: boolean;
  border?: CodeEditorBorder;
  hoverInteraction?: boolean;
  fill?: boolean;
  useValidationMessage?: boolean;
  evaluationSubstitutionType?: EvaluationSubstitutionType;
  popperPlacement?: Placement;
  popperZIndex?: Indices;
};

export type EditorProps = EditorStyleProps &
  EditorConfig & {
    input: Partial<WrappedFieldInputProps>;
  } & {
    additionalDynamicData?: Record<string, Record<string, unknown>>;
    promptMessage?: React.ReactNode | string;
    hideEvaluatedValue?: boolean;
    errors?: any;
    isInvalid?: boolean;
    isEditorHidden?: boolean;
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

class CodeEditor extends Component<Props, State> {
  static defaultProps = {
    marking: [bindingMarker],
    hinting: [bindingHint, commandsHelper],
  };

  codeEditorTarget = React.createRef<HTMLDivElement>();
  editor!: CodeMirror.Editor;
  hinters: Hinter[] = [];
  annotations: Annotation[] = [];
  updateLintingCallback: UpdateLintingCallback | undefined;
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
        lint: {
          getAnnotations: (_: string, callback: UpdateLintingCallback) => {
            this.updateLintingCallback = callback;
          },
          async: true,
          lintOnChange: false,
        },
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
        editor.on("change", _.debounce(this.handleChange, 600));
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
        if (getFeatureFlags().LINTING) {
          this.lintCode(editor);
        }
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
          if (inputValue !== editorValue && isString(inputValue)) {
            this.editor.setValue(inputValue);
          } else if (prevProps.isEditorHidden && !this.props.isEditorHidden) {
            // Even if Editor is updated with new value, it cannot update without layour calcs.
            //So, if it is hidden it does not reflect in UI, this code is to refresh editor if it was just made visible.
            this.editor.refresh();
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
    const entityInformation = this.getEntityInformation();
    if (
      entityInformation.entityType === ENTITY_TYPE.WIDGET &&
      this.editor.getValue().length === 0 &&
      !this.editor.state.completionActive
    )
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
      value !== inputValue &&
      this.state.isFocused
    ) {
      this.props.input.onChange(value);
    }
    CodeEditor.updateMarkings(this.editor, this.props.marking);
  };

  getEntityInformation = (): FieldEntityInformation => {
    const { dataTreePath, dynamicData, expected } = this.props;
    const entityInformation: FieldEntityInformation = {
      expectedType: expected?.autocompleteDataType,
    };
    if (dataTreePath) {
      const { entityName, propertyPath } = getEntityNameAndPropertyPath(
        dataTreePath,
      );
      entityInformation.entityName = entityName;
      const entity = dynamicData[entityName];

      if (entity) {
        if ("ENTITY_TYPE" in entity) {
          const entityType = entity.ENTITY_TYPE;
          if (
            entityType === ENTITY_TYPE.WIDGET ||
            entityType === ENTITY_TYPE.ACTION ||
            entityType === ENTITY_TYPE.JSACTION
          ) {
            entityInformation.entityType = entityType;
          }
        }
        if (isActionEntity(entity))
          entityInformation.entityId = entity.actionId;
        if (isWidgetEntity(entity))
          entityInformation.entityId = entity.widgetId;
      }
      entityInformation.propertyPath = propertyPath;
    }
    return entityInformation;
  };

  handleAutocompleteVisibility = (cm: CodeMirror.Editor) => {
    if (!this.state.isFocused) return;
    const entityInformation: FieldEntityInformation = this.getEntityInformation();
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

  lintCode(editor: CodeMirror.Editor) {
    const { dataTreePath, dynamicData } = this.props;

    if (!dataTreePath || !this.updateLintingCallback || !editor) {
      return;
    }

    const errors = _.get(
      dynamicData,
      getEvalErrorPath(dataTreePath),
      [],
    ) as EvaluationError[];

    let annotations: Annotation[] = [];

    annotations = getLintAnnotations(editor.getValue(), errors);

    this.updateLintingCallback(editor, annotations);
  }

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
    const validations = this.getPropertyValidation(dynamicData, dataTreePath);
    let { errors, isInvalid } = validations;
    const { pathEvaluatedValue } = validations;
    let evaluated = evaluatedValue;
    if (dataTreePath) {
      evaluated = pathEvaluatedValue;
    }

    const entityInformation = this.getEntityInformation();
    /* Evaluation results for snippet arguments. The props below can be used to set the validation errors when computed from parent component */
    if (this.props.errors) {
      errors = this.props.errors;
    }
    if (this.props.isInvalid !== undefined) {
      isInvalid = Boolean(this.props.isInvalid);
    }
    /*  Evaluation results for snippet snippets */

    if (getFeatureFlags().LINTING) {
      this.lintCode(this.editor);
    }

    const showEvaluatedValue =
      this.state.isFocused &&
      !hideEvaluatedValue &&
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
        )}
        <EvaluatedValuePopup
          entity={entityInformation}
          errors={errors}
          evaluatedValue={evaluated}
          evaluationSubstitutionType={evaluationSubstitutionType}
          expected={expected}
          hasError={isInvalid}
          hideEvaluatedValue={hideEvaluatedValue}
          isOpen={showEvaluatedValue}
          popperPlacement={this.props.popperPlacement}
          popperZIndex={this.props.popperZIndex}
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
  recentEntities: getRecentEntityIds(state),
});

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  executeCommand: (payload: SlashCommandPayload) =>
    dispatch(executeCommandAction(payload)),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(CodeEditor),
);
