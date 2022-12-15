import React, { Component } from "react";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
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
import _, { isEqual } from "lodash";

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
import {
  bindingMarker,
  entityMarker,
  NAVIGATE_TO_ATTRIBUTE,
} from "components/editorComponents/CodeEditor/markHelpers";
import { bindingHint } from "components/editorComponents/CodeEditor/hintHelpers";
import BindingPrompt from "./BindingPrompt";
import { showBindingPrompt } from "./BindingPromptHelper";
import { Button, ScrollIndicator } from "design-system";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import * as Sentry from "@sentry/react";
import {
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
} from "utils/DynamicBindingUtils";
import {
  addEventToHighlightedElement,
  getInputValue,
  isActionEntity,
  isWidgetEntity,
  removeEventFromHighlightedElement,
  removeNewLineChars,
} from "./codeEditorUtils";
import { commandsHelper } from "./commandsHelper";
import { getEntityNameAndPropertyPath } from "workers/Evaluation/evaluationUtils";
import { getPluginIdToImageLocation } from "sagas/selectors";
import { ExpectedValueExample } from "utils/validation/common";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import { Placement } from "@blueprintjs/popover2";
import { getLintAnnotations, getLintTooltipDirection } from "./lintHelpers";
import { executeCommandAction } from "actions/apiPaneActions";
import { startingEntityUpdate } from "actions/editorActions";
import { SlashCommandPayload } from "entities/Action";
import { Indices } from "constants/Layers";
import { replayHighlightClass } from "globalStyles/portals";
import {
  LINT_TOOLTIP_CLASS,
  LINT_TOOLTIP_JUSTIFIED_LEFT_CLASS,
  LintTooltipDirection,
} from "./constants";
import {
  autoIndentCode,
  getAutoIndentShortcutKey,
} from "./utils/autoIndentUtils";
import { getMoveCursorLeftKey } from "./utils/cursorLeftMovement";
import { interactionAnalyticsEvent } from "utils/AppsmithUtils";
import { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import {
  getCodeEditorLastCursorPosition,
  getIsInputFieldFocused,
} from "selectors/editorContextSelectors";
import {
  CodeEditorFocusState,
  setEditorFieldFocusAction,
} from "actions/editorContextActions";
import { updateCustomDef } from "utils/autocomplete/customDefUtils";
import { shouldFocusOnPropertyControl } from "utils/editorContextUtils";
import { getEntityLintErrors } from "selectors/lintingSelectors";
import {
  EntityNavigationData,
  getEntitiesForNavigation,
} from "selectors/navigationSelectors";
import history, { NavigationMethod } from "utils/history";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

type ReduxStateProps = ReturnType<typeof mapStateToProps>;
type ReduxDispatchProps = ReturnType<typeof mapDispatchToProps>;

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
  focusElementName?: string;
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
  blockCompletions?: FieldEntityInformation["blockCompletions"];
};
/**
 *  line => Line to which the gutter is added
 *
 * element => HTML Element that gets added to line
 *
 * isFocusedAction => function called when focused
 */
export type GutterConfig = {
  line: number;
  element: HTMLElement;
  isFocusedAction: () => void;
};

export type CodeEditorGutter = {
  getGutterConfig:
    | ((editorValue: string, cursorLineNumber: number) => GutterConfig | null)
    | null;
  gutterId: string;
};

export type EditorProps = EditorStyleProps &
  EditorConfig & {
    input: Partial<WrappedFieldInputProps>;
  } & {
    additionalDynamicData?: AdditionalDynamicDataTree;
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
    isReadOnly?: boolean;
    isRawView?: boolean;
    isJSObject?: boolean;
    containerHeight?: number;
    // Custom gutter
    customGutter?: CodeEditorGutter;

    // On focus and blur event handler
    onEditorBlur?: () => void;
    onEditorFocus?: () => void;
  };

interface Props extends ReduxStateProps, EditorProps, ReduxDispatchProps {}

type State = {
  isFocused: boolean;
  isOpened: boolean;
  autoCompleteVisible: boolean;
  hinterOpen: boolean;
  // Flag for determining whether the entity change has been started or not so that even if the initial and final value remains the same, the status should be changed to not loading
  changeStarted: boolean;
  ctrlPressed: boolean;
};

const getEditorIdentifier = (props: EditorProps): string => {
  return props.dataTreePath || props.focusElementName || "";
};

class CodeEditor extends Component<Props, State> {
  static defaultProps = {
    marking: [bindingMarker, entityMarker],
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
      ctrlPressed: false,
    };
    this.updatePropertyValue = this.updatePropertyValue.bind(this);
  }
  componentDidMount(): void {
    if (this.codeEditorTarget.current) {
      const options: EditorConfiguration = {
        autoRefresh: true,
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
        // Used to disable multiple cursors on the editor
        // when command/ctrl click is done
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        configureMouse: () => {
          return {
            addNew: false,
          };
        },
      };

      const gutters = new Set<string>();

      if (!this.props.input.onChange || this.props.disabled) {
        options.readOnly = true;
        options.scrollbarStyle = "null";
      }

      const moveCursorLeftKey = getMoveCursorLeftKey();
      options.extraKeys = {
        [moveCursorLeftKey]: "goLineStartSmart",
      };

      if (this.props.tabBehaviour === TabBehaviour.INPUT) {
        options.extraKeys["Tab"] = false;
      }

      if (this.props.customGutter) {
        gutters.add(this.props.customGutter.gutterId);
      }

      if (!this.props.isReadOnly) {
        const autoIndentKey = getAutoIndentShortcutKey();
        options.extraKeys[autoIndentKey] = (editor) => {
          autoIndentCode(editor);
          AnalyticsUtil.logEvent("PRETTIFY_CODE_KEYBOARD_SHORTCUT");
        };
      }

      if (this.props.folding) {
        options.foldGutter = true;
        gutters.add("CodeMirror-linenumbers");
        gutters.add("CodeMirror-foldgutter");
        // @ts-expect-error: Types are not available
        options.foldOptions = {
          widget: () => {
            return "\u002E\u002E\u002E";
          },
        };
      }
      options.gutters = Array.from(gutters);

      // Set value of the editor
      const inputValue = getInputValue(this.props.input.value) || "";
      if (this.props.size === EditorSize.COMPACT) {
        options.value = removeNewLineChars(inputValue);
      } else {
        options.value = inputValue;
      }

      // @ts-expect-error: Types are not available
      options.finishInit = function(
        this: CodeEditor,
        editor: CodeMirror.Editor,
      ) {
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
        editor.on("mousedown", this.handleClick);

        if (this.props.height) {
          editor.setSize("100%", this.props.height);
        } else {
          editor.setSize("100%", "100%");
        }

        CodeEditor.updateMarkings(
          editor,
          this.props.marking,
          this.props.entitiesForNavigation,
        );

        this.hinters = CodeEditor.startAutocomplete(
          editor,
          this.props.hinting,
          this.props.dynamicData,
        );

        this.lintCode(editor);

        setTimeout(() => {
          if (this.props.editorIsFocused && shouldFocusOnPropertyControl()) {
            editor.focus();
          }
        }, 200);
      }.bind(this);

      // Finally create the Codemirror editor
      this.editor = CodeMirror(this.codeEditorTarget.current, options);
      // DO NOT ADD CODE BELOW. If you need to do something with the editor right after it’s created,
      // put that code into `options.finishInit()`.
    }
    window.addEventListener("keydown", this.handleKeydown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    if (this.props.dynamicData !== nextProps.dynamicData) {
      // check if isFocused as the other components that are not focused don't need a rerender (perf)
      // check if errors have changed as they will come from outside and we want to update if they have changed
      // check if isJSObject.. TODO answer why?
      let areErrorsEqual = true;
      if (this.props.dataTreePath) {
        const errors = this.getErrors(
          this.props.dynamicData,
          this.props.dataTreePath,
        );
        const newErrors = this.getErrors(
          nextProps.dynamicData,
          this.props.dataTreePath,
        );
        if (errors && newErrors) {
          areErrorsEqual = isEqual(errors, newErrors);
        }
      }
      return nextState.isFocused || !!nextProps.isJSObject || !areErrorsEqual;
    }

    return true;
  }

  //Debounce editor refresh request as container resizing triggers many change events.
  debounceEditorRefresh = _.debounce(async () => {
    this.editor.refresh();
  }, 100);

  componentDidUpdate(prevProps: Props): void {
    const identifierHasChanged =
      getEditorIdentifier(this.props) !== getEditorIdentifier(prevProps);
    if (
      prevProps.containerHeight &&
      this.props.containerHeight &&
      prevProps.containerHeight < this.props.containerHeight
    ) {
      //Refresh editor when the container height is increased.
      this.debounceEditorRefresh();
    }
    if (identifierHasChanged && shouldFocusOnPropertyControl()) {
      setTimeout(() => {
        if (this.props.editorIsFocused) {
          this.editor.focus();
        }
      }, 200);
    }
    this.editor.operation(() => {
      if (prevProps.lintErrors !== this.props.lintErrors) {
        this.lintCode(this.editor);
      }

      const editorValue = this.editor.getValue();
      // Safe update of value of the editor when value updated outside the editor
      const inputValue = getInputValue(this.props.input.value);
      const previousInputValue = getInputValue(prevProps.input.value);

      if (_.isString(inputValue)) {
        /* We want to check if the input value and the editor value is out of sync.
         * We always want to make sure editor is the correct value since the source if the input value
         * But the editor updates the input value on change.
         * To solve this:
         * We check if the values are different,
         * and we check if they are different because the input value has changed
         * and not because the editor value has changed
         * */
        if (inputValue !== editorValue && inputValue !== previousInputValue) {
          // If it is focused update it only if the identifier has changed
          // if not focused, can be updated
          if (this.state.isFocused) {
            if (identifierHasChanged) {
              this.setEditorInput(inputValue);
            }
          } else {
            this.setEditorInput(inputValue);
          }
        } else if (prevProps.isEditorHidden && !this.props.isEditorHidden) {
          // Even if Editor is updated with new value, it cannot update without layour calcs.
          //So, if it is hidden it does not reflect in UI, this code is to refresh editor if it was just made visible.
          this.editor.refresh();
        }
      } else if (previousInputValue !== inputValue) {
        // handles case when inputValue changes from a truthy to a falsy value
        this.setEditorInput("");
      }

      CodeEditor.updateMarkings(
        this.editor,
        this.props.marking,
        this.props.entitiesForNavigation,
      );
    });
  }

  setEditorInput(value: string) {
    this.editor.setValue(value);
    // when input gets updated on focus out clear undo/redo from codeMirror History
    this.editor.clearHistory();
  }

  handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    this.handleCustomGutter(this.editor.lineAtHeight(e.clientY, "window"));
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
    window.removeEventListener("keyup", this.handleKeyUp);

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
    // @ts-expect-error: Types are not available
    this.editor.closeHint();
  }

  private handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (document.activeElement === this.codeEditorTarget.current) {
          this.editor.focus();
          this.codeEditorTarget.current?.dispatchEvent(
            interactionAnalyticsEvent({ key: e.key }),
          );
          e.preventDefault();
        }
        break;
      case "Escape":
        if (this.state.isFocused) {
          this.codeEditorTarget.current?.focus();
          this.codeEditorTarget.current?.dispatchEvent(
            interactionAnalyticsEvent({ key: e.key }),
          );
        }
        break;
      case "Tab":
        if (document.activeElement === this.codeEditorTarget.current) {
          this.codeEditorTarget.current?.dispatchEvent(
            interactionAnalyticsEvent({
              key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
            }),
          );
        }
        break;
      case "Control":
      case "Meta":
        this.setState({
          ctrlPressed: true,
        });
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Control":
      case "Meta":
        this.setState({
          ctrlPressed: false,
        });
    }
  };

  static startAutocomplete(
    editor: CodeMirror.Editor,
    hinting: Array<HintHelper>,
    dynamicData: DataTree,
  ) {
    return hinting.map((helper) => {
      return helper(editor, dynamicData);
    });
  }

  handleClick = (cm: CodeMirror.Editor, event: MouseEvent) => {
    if (
      event.target instanceof Element &&
      event.target.hasAttribute(NAVIGATE_TO_ATTRIBUTE)
    ) {
      if (event.ctrlKey || event.metaKey) {
        const navigationAttribute = event.target.attributes.getNamedItem(
          NAVIGATE_TO_ATTRIBUTE,
        );
        if (!navigationAttribute) return;
        const entityToNavigate = navigationAttribute.value;

        // focus out of the input
        document.body.focus();
        this.setState(
          {
            isFocused: false,
          },
          () => {
            const navigationData = this.props.entitiesForNavigation[
              entityToNavigate
            ];
            history.push(navigationData.url, {
              invokedBy: NavigationMethod.CommandClick,
            });

            // TODO fix the widget navigation issue to remove this
            if (navigationData.type === ENTITY_TYPE.WIDGET) {
              this.props.selectWidget(navigationData.id);
            }
          },
        );
      }
    }
  };

  handleCustomGutter = (lineNumber: number | null, isFocused = false) => {
    const { customGutter } = this.props;
    const editor = this.editor;
    if (!customGutter || !editor) return;
    editor.clearGutter(customGutter.gutterId);

    if (lineNumber && customGutter.getGutterConfig) {
      const gutterConfig = customGutter.getGutterConfig(
        editor.getValue(),
        lineNumber,
      );
      if (!gutterConfig) return;
      editor.setGutterMarker(
        gutterConfig.line,
        customGutter.gutterId,
        gutterConfig.element,
      );
      isFocused && gutterConfig.isFocusedAction();
    }
  };

  handleCursorMovement = (cm: CodeMirror.Editor) => {
    this.handleCustomGutter(cm.getCursor().line, true);
    // ignore if disabled
    if (!this.props.input.onChange || this.props.disabled) {
      return;
    }
    const mode = cm.getModeAt(cm.getCursor());
    if (
      mode &&
      [
        EditorModes.JAVASCRIPT,
        EditorModes.JSON,
        EditorModes.GRAPHQL,
        EditorModes.GRAPHQL_WITH_BINDING,
      ].includes(mode.name)
    ) {
      cm.setOption("matchBrackets", true);
    } else {
      cm.setOption("matchBrackets", false);
    }
  };

  handleEditorFocus = (cm: CodeMirror.Editor) => {
    this.setState({ isFocused: true });
    const { ch, line, sticky } = cm.getCursor();
    // Check if it is a user focus
    if (
      ch === 0 &&
      line === 0 &&
      sticky === null &&
      this.props.editorLastCursorPosition
    ) {
      cm.setCursor(this.props.editorLastCursorPosition);
    }

    if (!cm.state.completionActive) {
      updateCustomDef(this.props.additionalDynamicData);

      const entityInformation = this.getEntityInformation();
      const { blockCompletions } = this.props;
      this.hinters
        .filter((hinter) => hinter.fireOnFocus)
        .forEach(
          (hinter) =>
            hinter.showHint &&
            hinter.showHint(cm, entityInformation, blockCompletions),
        );
    }

    if (this.props.onEditorFocus) {
      this.props.onEditorFocus();
    }
  };

  handleEditorBlur = () => {
    this.handleChange();
    this.setState({ isFocused: false });
    this.editor.setOption("matchBrackets", false);
    this.handleCustomGutter(null);
    const cursor = this.editor.getCursor();
    this.props.setCodeEditorLastFocus({
      key: getEditorIdentifier(this.props),
      cursorPosition: {
        ch: cursor.ch,
        line: cursor.line,
      },
    });
    if (this.props.onEditorBlur) {
      this.props.onEditorBlur();
    }
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
    const { lintErrors } = this.props;

    if (lintErrors.length === 0) return;
    const lintTooltipList = document.getElementsByClassName(LINT_TOOLTIP_CLASS);
    if (!lintTooltipList) return;
    for (const tooltip of lintTooltipList) {
      if (
        tooltip &&
        getLintTooltipDirection(tooltip) === LintTooltipDirection.left
      ) {
        tooltip.classList.add(LINT_TOOLTIP_JUSTIFIED_LEFT_CLASS);
      }
    }
  };

  handleChange = (
    instance?: CodeMirror.Editor,
    changeObj?: CodeMirror.EditorChangeLinkedList,
  ) => {
    const value = this.editor?.getValue() || "";
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
    if (this.editor) {
      CodeEditor.updateMarkings(
        this.editor,
        this.props.marking,
        this.props.entitiesForNavigation,
      );
    }
  };

  handleDebouncedChange = _.debounce(this.handleChange, 600);

  startChange = (
    instance: CodeMirror.Editor,
    changeObj: CodeMirror.EditorChangeLinkedList,
  ) => {
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
      this.props.startingEntityUpdate();
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
        if (isWidgetEntity(entity)) {
          const isTriggerPath = entity.triggerPaths[propertyPath];
          entityInformation.entityId = entity.widgetId;
          if (isTriggerPath)
            entityInformation.expectedType = AutocompleteDataType.FUNCTION;
        }
      }
      entityInformation.propertyPath = propertyPath;
    }
    return entityInformation;
  };

  handleAutocompleteVisibility = (cm: CodeMirror.Editor) => {
    if (!this.state.isFocused) return;
    const entityInformation = this.getEntityInformation();
    const { blockCompletions } = this.props;
    let hinterOpen = false;
    for (let i = 0; i < this.hinters.length; i++) {
      hinterOpen = this.hinters[i].showHint(cm, entityInformation, {
        blockCompletions,
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
      // @ts-expect-error: Types are not available
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
    const {
      additionalDynamicData: contextData,
      dataTreePath,
      isJSObject,
    } = this.props;

    if (!dataTreePath || !this.updateLintingCallback || !editor) {
      return;
    }
    const lintErrors = this.props.lintErrors;

    const annotations = getLintAnnotations(editor.getValue(), lintErrors, {
      isJSObject,
      contextData,
    });

    this.updateLintingCallback(editor, annotations);
  }

  static updateMarkings = (
    editor: CodeMirror.Editor,
    marking: Array<MarkHelper>,
    entityNavigationData: EntityNavigationData,
  ) => {
    marking.forEach((helper) => helper(editor, entityNavigationData));
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

  getErrors(dynamicData: DataTree, dataTreePath: string) {
    return _.get(
      dynamicData,
      getEvalErrorPath(dataTreePath),
      [],
    ) as EvaluationError[];
  }

  getPropertyValidation = (
    dataTreePath?: string,
  ): {
    evalErrors: EvaluationError[];
    pathEvaluatedValue: unknown;
  } => {
    if (!dataTreePath) {
      return {
        evalErrors: [],
        pathEvaluatedValue: undefined,
      };
    }

    const evalErrors = this.getErrors(this.props.dynamicData, dataTreePath);

    const pathEvaluatedValue = _.get(
      this.props.dynamicData,
      getEvalValuePath(dataTreePath),
    );

    return {
      evalErrors,
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

    const { evalErrors, pathEvaluatedValue } = this.getPropertyValidation(
      dataTreePath,
    );

    let errors = evalErrors,
      isInvalid = evalErrors.length > 0,
      evaluated = evaluatedValue;

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
          dataTreePath={this.props.dataTreePath}
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
            ctrlPressed={this.state.ctrlPressed}
            disabled={disabled}
            editorTheme={this.props.theme}
            fillUp={fill}
            hasError={isInvalid}
            height={height}
            hoverInteraction={hoverInteraction}
            isFocused={this.state.isFocused}
            isNotHover={this.state.isFocused || this.state.isOpened}
            isRawView={this.props.isRawView}
            isReadOnly={this.props.isReadOnly}
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

const mapStateToProps = (state: AppState, props: EditorProps) => ({
  dynamicData: getDataTreeForAutocomplete(state),
  datasources: state.entities.datasources,
  pluginIdToImageLocation: getPluginIdToImageLocation(state),
  recentEntities: getRecentEntityIds(state),
  lintErrors: getEntityLintErrors(state, props.dataTreePath),
  editorIsFocused: getIsInputFieldFocused(state, getEditorIdentifier(props)),
  editorLastCursorPosition: getCodeEditorLastCursorPosition(
    state,
    getEditorIdentifier(props),
  ),
  entitiesForNavigation: getEntitiesForNavigation(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  executeCommand: (payload: SlashCommandPayload) =>
    dispatch(executeCommandAction(payload)),
  startingEntityUpdate: () => dispatch(startingEntityUpdate()),
  setCodeEditorLastFocus: (payload: CodeEditorFocusState) =>
    dispatch(setEditorFieldFocusAction(payload)),
  selectWidget: (widgetId: string) =>
    dispatch(selectWidgetInitAction(widgetId, false)),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(CodeEditor),
);
