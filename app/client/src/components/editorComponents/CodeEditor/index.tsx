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
  isCloseKey,
  isModifierKey,
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
  addEventToHighlightedElement,
  removeEventFromHighlightedElement,
} from "./codeEditorUtils";
import { commandsHelper } from "./commandsHelper";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import Button from "components/ads/Button";
import { getPluginIdToImageLocation } from "sagas/selectors";
import { ExpectedValueExample } from "utils/validation/common";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { Placement } from "@blueprintjs/popover2";
import { getLintAnnotations, getLintTooltipDirection } from "./lintHelpers";
import { executeCommandAction } from "actions/apiPaneActions";
import { startingEntityUpdation } from "actions/editorActions";
import { SlashCommandPayload } from "entities/Action";
import { Indices } from "constants/Layers";
import { replayHighlightClass } from "globalStyles/portals";
import {
  LintTooltipDirection,
  LINT_TOOLTIP_CLASS,
  LINT_TOOLTIP_JUSTIFIFIED_LEFT_CLASS,
} from "./constants";

interface ReduxStateProps {
  dynamicData: DataTree;
  datasources: any;
  pluginIdToImageLocation: Record<string, string>;
  recentEntities: string[];
}

interface ReduxDispatchProps {
  executeCommand: (payload: any) => void;
  startingEntityUpdation: () => void;
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
    codeEditorVisibleOverflow?: boolean; // flag for determining the input overflow type for the code editor
    showCustomToolTipForHighlightedText?: boolean;
    highlightedTextClassName?: string;
    handleMouseEnter?: (event: MouseEvent) => void;
    handleMouseLeave?: () => void;
  };

type Props = ReduxStateProps &
  EditorProps &
  ReduxDispatchProps & { dispatch?: () => void };

type State = {
  isFocused: boolean;
  isOpened: boolean;
  autoCompleteVisible: boolean;
  hinterOpen: boolean;
  // Flag for determining whether the entity change has been started or not so that even if the initial and final value remains the same, the status should be changed to not loading
  changeStarted: boolean;
  // state of lint errors in editor
  hasLintError: boolean;
};

class CodeEditor extends Component<Props, State> {
  static defaultProps = {
    marking: [bindingMarker],
    hinting: [bindingHint, commandsHelper],
  };
  // this is the higlighted element for any highlighted text in the codemirror
  highlightedUrlElement: HTMLElement | undefined;
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
      changeStarted: false,
      hasLintError: false,
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
        tabindex: -1,
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
      const inputValue = getInputValue(this.props.input.value) || "";
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
        editor.on("change", this.startChange);
        editor.on("keyup", this.handleAutocompleteKeyup);
        editor.on("focus", this.handleEditorFocus);
        editor.on("cursorActivity", this.handleCursorMovement);
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
          this.props.additionalDynamicData,
        );

        this.lintCode(editor);
      };

      // Finally create the Codemirror editor
      this.editor = CodeMirror(this.codeEditorTarget.current, options);
      // DO NOT ADD CODE BELOW. If you need to do something with the editor right after it’s created,
      // put that code into `options.finishInit()`.
    }
    window.addEventListener("keydown", this.handleKeydown);
  }

  componentDidUpdate(prevProps: Props): void {
    this.editor.operation(() => {
      if (!this.state.isFocused) {
        // const currentMode = this.editor.getOption("mode");
        const editorValue = this.editor.getValue();
        // Safe update of value of the editor when value updated outside the editor
        const inputValue = getInputValue(this.props.input.value);
        const previousInputValue = getInputValue(prevProps.input.value);

        if (!!inputValue || inputValue === "") {
          if (inputValue !== editorValue && isString(inputValue)) {
            this.editor.setValue(inputValue);
            this.editor.clearHistory(); // when input gets updated on focus out clear undo/redo from codeMirror History
          } else if (prevProps.isEditorHidden && !this.props.isEditorHidden) {
            // Even if Editor is updated with new value, it cannot update without layour calcs.
            //So, if it is hidden it does not reflect in UI, this code is to refresh editor if it was just made visible.
            this.editor.refresh();
          }
        } else if (previousInputValue !== inputValue) {
          // handles case when inputValue changes from a truthy to a falsy value
          this.editor.setValue("");
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

  handleMouseMove = () => {
    // this code only runs when we want custom tool tip for any highlighted text inside codemirror instance
    if (
      this.props.showCustomToolTipForHighlightedText &&
      this.props.highlightedTextClassName
    ) {
      addEventToHighlightedElement(
        this.highlightedUrlElement,
        this.props.highlightedTextClassName,
        [
          {
            eventType: "mouseenter",
            eventHandlerFn: this.props.handleMouseEnter,
          },
          {
            eventType: "mouseleave",
            eventHandlerFn: this.props.handleMouseLeave,
          },
        ],
      );
    }
  };

  componentWillUnmount() {
    // if the highlighted element exists, remove the event listeners to prevent memory leaks
    if (this.highlightedUrlElement) {
      removeEventFromHighlightedElement(this.highlightedUrlElement, [
        {
          eventType: "mouseenter",
          eventHandlerFn: this.props.handleMouseEnter,
        },
        {
          eventType: "mouseleave",
          eventHandlerFn: this.props.handleMouseLeave,
        },
      ]);
    }

    window.removeEventListener("keydown", this.handleKeydown);

    // return if component unmounts before editor is created
    if (!this.editor) return;

    this.editor.off("beforeChange", this.handleBeforeChange);
    this.editor.off("change", this.startChange);
    this.editor.off("keyup", this.handleAutocompleteKeyup);
    this.editor.off("focus", this.handleEditorFocus);
    this.editor.off("cursorActivity", this.handleCursorMovement);
    this.editor.off("blur", this.handleEditorBlur);
    this.editor.off("postPick", () =>
      this.handleAutocompleteVisibility(this.editor),
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: No types available
    this.editor.closeHint();
  }

  private handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (document.activeElement === this.codeEditorTarget.current) {
          this.editor.focus();
          e.preventDefault();
        }
        break;
      case "Escape":
        if (this.state.isFocused) this.codeEditorTarget.current?.focus();
        break;
    }
  };

  static startAutocomplete(
    editor: CodeMirror.Editor,
    hinting: Array<HintHelper>,
    dynamicData: DataTree,
    additionalDynamicData?: Record<string, Record<string, unknown>>,
  ) {
    return hinting.map((helper) => {
      return helper(editor, dynamicData, additionalDynamicData);
    });
  }

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

  handleEditorFocus = (cm: CodeMirror.Editor) => {
    this.setState({ isFocused: true });
    if (!cm.state.completionActive) {
      const entityInformation: FieldEntityInformation = this.getEntityInformation();
      this.hinters
        .filter((hinter) => hinter.fireOnFocus)
        .forEach(
          (hinter) => hinter.showHint && hinter.showHint(cm, entityInformation),
        );
    }
  };

  handleEditorBlur = () => {
    this.handleChange();
    this.setState({ isFocused: false });
    this.editor.setOption("matchBrackets", false);
  };

  handleBeforeChange = (
    cm: CodeMirror.Editor,
    change: CodeMirror.EditorChangeCancellable,
  ) => {
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
  };

  handleLintTooltip = () => {
    // return if there is no lint error in editor instance
    if (!this.state.hasLintError) return;
    const lintTooltipList = document.getElementsByClassName(LINT_TOOLTIP_CLASS);
    if (!lintTooltipList) return;
    for (const tooltip of lintTooltipList) {
      if (
        tooltip &&
        getLintTooltipDirection(tooltip) === LintTooltipDirection.left
      ) {
        tooltip.classList.add(LINT_TOOLTIP_JUSTIFIFIED_LEFT_CLASS);
      }
    }
  };

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
      ((value !== inputValue && this.state.isFocused) ||
        this.state.changeStarted)
    ) {
      this.setState({
        changeStarted: false,
      });
      this.props.input.onChange(value);
    }
    CodeEditor.updateMarkings(this.editor, this.props.marking);
  };

  handleDebouncedChange = _.debounce(this.handleChange, 600);

  startChange = (instance?: any, changeObj?: any) => {
    /* This action updates the status of the savingEntity to true so that any
      shortcut commands do not execute before updating the entity in the store */
    const value = this.editor.getValue() || "";
    const inputValue = this.props.input.value || "";
    if (
      this.props.input.onChange &&
      value !== inputValue &&
      this.state.isFocused &&
      !this.state.changeStarted
    ) {
      this.setState({
        changeStarted: true,
      });
      this.props.startingEntityUpdation();
    }
    this.handleDebouncedChange(instance, changeObj);
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

  handleAutocompleteKeyup = (cm: CodeMirror.Editor, event: KeyboardEvent) => {
    const key = event.key;
    if (isModifierKey(key)) return;
    const code = `${event.ctrlKey ? "Ctrl+" : ""}${event.code}`;
    if (isCloseKey(code) || isCloseKey(key)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      cm.closeHint();
      return;
    }
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    let showAutocomplete = false;
    /* Check if the character before cursor is completable to show autocomplete which backspacing */
    if (key === "/") {
      showAutocomplete = true;
    } else if (event.code === "Backspace") {
      const prevChar = line[cursor.ch - 1];
      showAutocomplete = !!prevChar && /[a-zA-Z_0-9.]/.test(prevChar);
    } else if (key === "{") {
      /* Autocomplete for { should show up only when a user attempts to write {{}} and not a code block. */
      const prevChar = line[cursor.ch - 2];
      showAutocomplete = prevChar === "{";
    } else if (key.length == 1) {
      showAutocomplete = /[a-zA-Z_0-9.]/.test(key);
      /* Autocomplete should be triggered only for characters that make up valid variable names */
    }
    showAutocomplete && this.handleAutocompleteVisibility(cm);
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

    const annotations = getLintAnnotations(editor.getValue(), errors);

    this.updateLintingCallback(editor, annotations);
  }

  static updateMarkings = (
    editor: CodeMirror.Editor,
    marking: Array<MarkHelper>,
  ) => {
    marking.forEach((helper) => helper(editor));
  };

  updatePropertyValue(value: string, cursor?: number) {
    this.editor.focus();
    if (value) {
      this.editor.setValue(value);
    }
    this.editor.setCursor({
      line: cursor || this.editor.lineCount() - 1,
      ch: this.editor.getLine(this.editor.lineCount() - 1).length - 2,
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

    const lintErrors = errors.filter(
      (error) => error.errorType === PropertyEvaluationErrorType.LINT,
    );

    if (!_.isEmpty(lintErrors)) {
      !this.state.hasLintError && this.setState({ hasLintError: true });
    } else {
      this.state.hasLintError && this.setState({ hasLintError: false });
    }

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
      codeEditorVisibleOverflow,
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

    this.lintCode(this.editor);

    const showEvaluatedValue =
      this.state.isFocused &&
      !hideEvaluatedValue &&
      ("evaluatedValue" in this.props ||
        ("dataTreePath" in this.props && !!dataTreePath));

    return (
      <DynamicAutocompleteInputWrapper
        className="t--code-editor-wrapper"
        isActive={(this.state.isFocused && !isInvalid) || this.state.isOpened}
        isError={isInvalid}
        isNotHover={this.state.isFocused || this.state.isOpened}
        skin={this.props.theme === EditorTheme.DARK ? Skin.DARK : Skin.LIGHT}
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
            tabIndex={-1}
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
            className={`${className} ${replayHighlightClass} ${
              isInvalid ? "t--codemirror-has-error" : ""
            }`}
            codeEditorVisibleOverflow={codeEditorVisibleOverflow}
            disabled={disabled}
            editorTheme={this.props.theme}
            fill={fill}
            hasError={isInvalid}
            height={height}
            hoverInteraction={hoverInteraction}
            isFocused={this.state.isFocused}
            isNotHover={this.state.isFocused || this.state.isOpened}
            onMouseMove={this.handleLintTooltip}
            onMouseOver={this.handleMouseMove}
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
            <div
              className="CodeEditorTarget"
              data-testid="code-editor-target"
              ref={this.codeEditorTarget}
              tabIndex={0}
            >
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
  startingEntityUpdation: () => dispatch(startingEntityUpdation()),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(CodeEditor),
);
