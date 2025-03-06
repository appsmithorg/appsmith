import React, { Component } from "react";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import type {
  Annotation,
  EditorConfiguration,
  UpdateLintingCallback,
} from "codemirror";
import CodeMirror from "codemirror";
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
import "codemirror/addon/comment/comment";
import "codemirror/mode/sql/sql.js";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/sql-hint";
import "codemirror/mode/css/css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/htmlmixed/htmlmixed";
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import EvaluatedValuePopup from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import type { WrappedFieldInputProps } from "redux-form";
import _, { debounce, isEqual, isNumber } from "lodash";
import scrollIntoView from "scroll-into-view-if-needed";

import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { EvaluationSubstitutionType } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { Skin } from "constants/DefaultTheme";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import "components/editorComponents/CodeEditor/sql/customMimes";
import "components/editorComponents/CodeEditor/modes";
import type {
  CodeEditorBorder,
  EditorConfig,
  FieldEntityInformation,
  Hinter,
  HintHelper,
  MarkHelper,
  BlockCompletion,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  EditorThemes,
  isCloseKey,
  isModifierKey,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  DynamicAutocompleteInputWrapper,
  EditorWrapper,
  IconContainer,
  PEEK_STYLE_PERSIST_CLASS,
} from "components/editorComponents/CodeEditor/styledComponents";
import {
  entityMarker,
  NAVIGATE_TO_ATTRIBUTE,
} from "components/editorComponents/CodeEditor/MarkHelpers/entityMarker";
import {
  bindingHintHelper,
  sqlHint,
} from "components/editorComponents/CodeEditor/hintHelpers";

import { showBindingPrompt } from "./BindingPromptHelper";
import { Button } from "@appsmith/ads";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import * as Sentry from "@sentry/react";
import type { EvaluationError, LintError } from "utils/DynamicBindingUtils";
import { getEvalErrorPath, isDynamicValue } from "utils/DynamicBindingUtils";
import {
  addEventToHighlightedElement,
  getInputValue,
  removeEventFromHighlightedElement,
  removeNewLineCharsIfRequired,
  shouldShowSlashCommandMenu,
} from "./codeEditorUtils";
import { slashCommandHintHelper } from "./commandsHelper";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { getPluginIdToPlugin } from "sagas/selectors";
import type { ExpectedValueExample } from "utils/validation/common";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import type { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { Placement } from "@blueprintjs/popover2";
import { getLintAnnotations, getLintTooltipDirection } from "./lintHelpers";
import { startingEntityUpdate } from "actions/editorActions";
import type { SlashCommandPayload } from "entities/Action";
import type { Indices } from "constants/Layers";
import { replayHighlightClass } from "globalStyles/portals";
import {
  CURSOR_CLASS_NAME,
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
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import {
  getCodeEditorLastCursorPosition,
  getIsInputFieldFocused,
} from "selectors/editorContextSelectors";
import type { CodeEditorFocusState } from "actions/editorContextActions";
import { setEditorFieldFocusAction } from "actions/editorContextActions";
import { updateCustomDef } from "utils/autocomplete/customDefUtils";
import { shouldFocusOnPropertyControl } from "utils/editorContextUtils";
import { getEntityLintErrors } from "selectors/lintingSelectors";
import { getCodeCommentKeyMap, handleCodeComment } from "./utils/codeComment";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import { getEntitiesForNavigation } from "selectors/navigationSelectors";
import history, { NavigationMethod } from "utils/history";
import { CursorPositionOrigin } from "ee/reducers/uiReducers/editorContextReducer";
import type { PeekOverlayStateProps } from "./PeekOverlayPopup/PeekOverlayPopup";
import { PeekOverlayPopUp } from "./PeekOverlayPopup/PeekOverlayPopup";
import ConfigTreeActions from "utils/configTree";
import {
  getSaveAndAutoIndentKey,
  saveAndAutoIndentCode,
} from "./utils/saveAndAutoIndent";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { AIWindow } from "ee/components/editorComponents/GPT";
import { AskAIButton } from "ee/components/editorComponents/GPT/AskAIButton";
import classNames from "classnames";
import { isAIEnabled } from "ee/components/editorComponents/GPT/trigger";
import {
  getAllDatasourceTableKeys,
  selectInstalledLibraries,
} from "ee/selectors/entitiesSelector";
import { debug } from "loglevel";
import { PeekOverlayExpressionIdentifier, SourceType } from "@shared/ast";
import type { MultiplexingModeConfig } from "components/editorComponents/CodeEditor/modes";
import { MULTIPLEXING_MODE_CONFIGS } from "components/editorComponents/CodeEditor/modes";
import { getDeleteLineShortcut } from "./utils/deleteLine";
import { CodeEditorSignPosting } from "ee/components/editorComponents/CodeEditorSignPosting";
import { getFocusablePropertyPaneField } from "selectors/propertyPaneSelectors";
import resizeObserver from "utils/resizeObserver";
import { EMPTY_BINDING } from "../ActionCreator/constants";
import {
  resetActiveEditorField,
  setActiveEditorField,
} from "actions/activeFieldActions";
import CodeMirrorTernService from "utils/autocomplete/CodemirrorTernService";
import { getEachEntityInformation } from "ee/utils/autocomplete/EntityDefinitions";
import { getCurrentPageId } from "selectors/editorSelectors";
import { executeCommandAction } from "actions/pluginActionActions";
import { PEEK_OVERLAY_DELAY } from "./PeekOverlayPopup/constants";

type ReduxStateProps = ReturnType<typeof mapStateToProps>;
type ReduxDispatchProps = ReturnType<typeof mapDispatchToProps>;

export interface CodeEditorExpected {
  type: string;
  example: ExpectedValueExample;
  autocompleteDataType: AutocompleteDataType;
  openExampleTextByDefault?: boolean;
}

export interface EditorStyleProps {
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  blockCompletions?: Array<BlockCompletion>;
}

/**
 *  line => Line to which the gutter is added
 *
 * element => HTML Element that gets added to line
 *
 * isFocusedAction => function called when focused
 */
export interface GutterConfig {
  line: number;
  element: HTMLElement;
  isFocusedAction: () => void;
}

export interface CodeEditorGutter {
  getGutterConfig:
    | ((editorValue: string, cursorLineNumber: number) => GutterConfig | null)
    | null;
  gutterId: string;
}

export type EditorProps = EditorStyleProps &
  EditorConfig & {
    input: Partial<WrappedFieldInputProps>;
  } & {
    additionalDynamicData?: AdditionalDynamicDataTree;
    promptMessage?: React.ReactNode | string;
    hideEvaluatedValue?: boolean;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors?: any;
    isInvalid?: boolean;
    isEditorHidden?: boolean;
    codeEditorVisibleOverflow?: boolean; // flag for determining the input overflow type for the code editor
    showCustomToolTipForHighlightedText?: boolean;
    highlightedTextClassName?: string;
    handleMouseEnter?: (event: MouseEvent) => void;
    handleMouseLeave?: () => void;
    AIAssisted?: boolean;
    isReadOnly?: boolean;
    isRawView?: boolean;
    isJSObject?: boolean;
    jsObjectName?: string;
    ignoreSlashCommand?: boolean;
    ignoreBinding?: boolean;
    ignoreAutoComplete?: boolean;
    maxHeight?: string | number;

    // Custom gutter
    customGutter?: CodeEditorGutter;
    positionCursorInsideBinding?: boolean;

    // On focus and blur event handler
    onEditorBlur?: () => void;
    onEditorFocus?: () => void;
    lineCommentString?: string;
    evaluatedPopUpLabel?: string;
    removeHoverAndFocusStyle?: boolean;

    customErrors?: LintError[];
  };

interface Props extends ReduxStateProps, EditorProps, ReduxDispatchProps {}

interface State {
  isFocused: boolean;
  isOpened: boolean;
  autoCompleteVisible: boolean;
  hinterOpen: boolean;
  // Flag for determining whether the entity change has been started or not so that even if the initial and final value remains the same, the status should be changed to not loading
  changeStarted: boolean;
  ctrlPressed: boolean;
  peekOverlayProps:
    | (PeekOverlayStateProps & {
        tokenElement: Element;
      })
    | undefined;
  isDynamic: boolean;
  showAIWindow: boolean;
  ternToolTipActive: boolean;
}

const getEditorIdentifier = (props: EditorProps): string => {
  return props.dataTreePath || props.focusElementName || "";
};

class CodeEditor extends Component<Props, State> {
  static defaultProps = {
    marking: [entityMarker],
    lineCommentString: "//",
    hinting: [bindingHintHelper, slashCommandHintHelper, sqlHint.hinter],
  };
  // this is the higlighted element for any highlighted text in the codemirror
  highlightedUrlElement: HTMLElement | undefined;
  // this is the outer element encompassing the editor
  codeEditorTarget = React.createRef<HTMLDivElement>();
  editor!: CodeMirror.Editor;
  hinters: Hinter[] = [];
  annotations: Annotation[] = [];
  updateLintingCallback: UpdateLintingCallback | undefined;
  private peekOverlayExpressionIdentifier: PeekOverlayExpressionIdentifier;
  private editorWrapperRef = React.createRef<HTMLDivElement>();
  currentLineNumber: number | null = null;
  AIEnabled = false;
  private multiplexConfig?: MultiplexingModeConfig;

  constructor(props: Props) {
    super(props);
    this.state = {
      isDynamic: false,
      isFocused: false,
      isOpened: false,
      autoCompleteVisible: false,
      hinterOpen: false,
      changeStarted: false,
      ctrlPressed: false,
      peekOverlayProps: undefined,
      showAIWindow: false,
      ternToolTipActive: false,
    };
    this.updatePropertyValue = this.updatePropertyValue.bind(this);
    this.focusEditor = this.focusEditor.bind(this);
    this.peekOverlayExpressionIdentifier = new PeekOverlayExpressionIdentifier(
      props.isJSObject
        ? {
            sourceType: SourceType.module,
            thisExpressionReplacement: props.jsObjectName,
          }
        : {
            sourceType: SourceType.script,
          },
      props.input.value,
    );
    this.multiplexConfig = MULTIPLEXING_MODE_CONFIGS[this.props.mode];
    /**
     * Decides if AI is enabled by looking at repo, feature flags, props and environment
     */
    this.AIEnabled =
      isAIEnabled(this.props.featureFlags, this.props.mode) &&
      Boolean(this.props.AIAssisted);
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
          this.props.size === EditorSize.COMPACT ||
          this.props.size === EditorSize.COMPACT_RETAIN_FORMATTING
            ? "null"
            : "native",
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

      options.extraKeys = {
        [getMoveCursorLeftKey()]: "goLineStartSmart",
        [getCodeCommentKeyMap()]: handleCodeComment(
          // We've provided the default props value for lineCommentString
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.props.lineCommentString!,
        ),
        [getSaveAndAutoIndentKey()]: (editor) => {
          saveAndAutoIndentCode(editor);
          AnalyticsUtil.logEvent("PRETTIFY_AND_SAVE_KEYBOARD_SHORTCUT");
        },
        [getDeleteLineShortcut()]: () => {
          return;
        },
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

      options.value = removeNewLineCharsIfRequired(inputValue, this.props.size);

      // @ts-expect-error: Types are not available
      options.finishInit = function (
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
        editor.on("keydown", this.handleAutocompleteKeydown);
        editor.on("focus", this.handleEditorFocus);
        editor.on("cursorActivity", this.handleCursorMovement);
        editor.on("cursorActivity", this.debouncedArgHints);
        editor.on("blur", this.handleEditorBlur);
        editor.on("mousedown", this.handleClick);
        editor.on("scrollCursorIntoView", this.handleScrollCursorIntoView);
        CodeMirror.on(
          editor.getWrapperElement(),
          "mousemove",
          this.debounceHandleMouseOver,
        );

        if (this.props.height) {
          editor.setSize("100%", this.props.height);
        } else {
          editor.setSize("100%", "100%");
        }

        CodeEditor.updateMarkings(
          editor,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.props.marking!, // ! since defaultProps are set
          this.props.entitiesForNavigation,
        );

        this.hinters = CodeEditor.startAutocomplete(
          editor,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.props.hinting!, // ! since defaultProps are set
          this.props.entitiesForNavigation, // send navigation here
        );

        this.lintCode(editor);

        setTimeout(() => {
          if (this.props.editorIsFocused && shouldFocusOnPropertyControl()) {
            editor.focus();
          }
        }, 200);
      }.bind(this);
      sqlHint.setDatasourceTableKeys(this.props.datasourceTableKeys);

      // Finally create the Codemirror editor
      this.editor = CodeMirror(this.codeEditorTarget.current, options);
      // DO NOT ADD CODE BELOW. If you need to do something with the editor right after it’s created,
      // put that code into `options.finishInit()`.
    }

    window.addEventListener("keydown", this.handleKeydown);
    window.addEventListener("keyup", this.handleKeyUp);

    if (this.codeEditorTarget.current) {
      // refresh editor on resize which prevents issue #23796
      resizeObserver.observe(this.codeEditorTarget.current, [
        this.debounceEditorRefresh,
      ]);
    }

    if (
      this.props.positionCursorInsideBinding &&
      this.props.input.value === EMPTY_BINDING
    ) {
      this.editor.focus();
      this.editor.setCursor({
        ch: 2,
        line: 0,
      });
    }
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

  debouncedArgHints = _.debounce(() => {
    this.setState({
      ternToolTipActive: CodeMirrorTernService.updateArgHints(this.editor),
    });
  }, 200);

  componentDidUpdate(prevProps: Props): void {
    const identifierHasChanged =
      getEditorIdentifier(this.props) !== getEditorIdentifier(prevProps);

    const entityInformation = this.getEntityInformation();
    const isWidgetType = entityInformation.entityType === ENTITY_TYPE.WIDGET;

    const hasFocusedValueChanged =
      getEditorIdentifier(this.props) !== this.props.focusedProperty;

    if (hasFocusedValueChanged && isWidgetType) {
      if (this.state.showAIWindow) {
        this.setState({ showAIWindow: false });
      }
    }

    if (identifierHasChanged) {
      if (this.state.showAIWindow) {
        this.setState({ showAIWindow: false });
      }

      if (shouldFocusOnPropertyControl()) {
        setTimeout(() => {
          if (this.props.editorIsFocused) {
            this.editor.focus();
          }
        }, 200);
      }
    } else if (this.props.editorLastCursorPosition) {
      // This is for when we want to change cursor positions
      // for e.g navigating to a line from the debugger
      if (
        !isEqual(
          this.props.editorLastCursorPosition,
          prevProps.editorLastCursorPosition,
        ) &&
        this.props.editorLastCursorPosition.origin ===
          CursorPositionOrigin.Navigation
      ) {
        setTimeout(() => {
          if (this.props.editorIsFocused) {
            this.editor.focus();
          }
        }, 200);
      }
    }

    this.editor.operation(() => {
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
        if (inputValue !== editorValue) {
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

      if (
        this.props.entitiesForNavigation !== prevProps.entitiesForNavigation ||
        this.props.marking !== prevProps.marking
      ) {
        CodeEditor.updateMarkings(
          this.editor,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.props.marking!, // ! since defaultProps are set
          this.props.entitiesForNavigation,
        );
      }

      if (
        prevProps.lintErrors !== this.props.lintErrors ||
        prevProps.customErrors !== this.props.customErrors
      ) {
        this.lintCode(this.editor);
      } else {
        if (!!this.updateLintingCallback) {
          this.updateLintingCallback(this.editor, this.annotations);
        }
      }

      if (this.props.datasourceTableKeys !== prevProps.datasourceTableKeys) {
        sqlHint.setDatasourceTableKeys(this.props.datasourceTableKeys);
      }
    });

    if (prevProps.height !== this.props.height) {
      this.editor.setSize("100%", this.props.height);
    }
  }

  setEditorInput = (value: string) => {
    this.editor.setValue(value);
    // when input gets updated on focus out clear undo/redo from codeMirror History
    this.editor.clearHistory();
  };

  showPeekOverlay = (
    expression: string,
    paths: string[],
    tokenElement: Element,
  ) => {
    const tokenElementPosition = tokenElement.getBoundingClientRect();

    if (this.state.peekOverlayProps) {
      if (tokenElement === this.state.peekOverlayProps.tokenElement) return;

      this.hidePeekOverlay();
    }

    tokenElement.classList.add(PEEK_STYLE_PERSIST_CLASS);
    this.setState({
      peekOverlayProps: {
        objectName: paths[0],
        propertyPath: paths.slice(1),
        position: tokenElementPosition,
        tokenElement,
        textWidth: tokenElementPosition.width,
      },
    });

    if (this.state.ternToolTipActive) {
      CodeMirrorTernService.closeArgHints();
    }

    AnalyticsUtil.logEvent("PEEK_OVERLAY_OPENED", {
      property: expression,
    });
  };

  hidePeekOverlay = () => {
    if (this.state.peekOverlayProps) {
      this.state.peekOverlayProps.tokenElement.classList.remove(
        PEEK_STYLE_PERSIST_CLASS,
      );
      this.setState({
        peekOverlayProps: undefined,
      });
    }

    if (this.state.ternToolTipActive) {
      this.setState({
        ternToolTipActive: CodeMirrorTernService.updateArgHints(this.editor),
      });
    }
  };

  debounceHandleMouseOver = debounce(
    (ev) => this.handleMouseOver(ev),
    PEEK_OVERLAY_DELAY,
  );

  handleScrollCursorIntoView = (cm: CodeMirror.Editor, event: Event) => {
    event.preventDefault();

    const delayedWork = () => {
      if (!this.state.isFocused) return;

      const [cursorElement] = cm
        .getScrollerElement()
        .getElementsByClassName(CURSOR_CLASS_NAME);

      if (cursorElement) {
        scrollIntoView(cursorElement, {
          block: "nearest",
        });
      }
    };

    // We need to delay this because CodeMirror can fire scrollCursorIntoView as a view is being blurred
    // and another is being focused. The blurred editor still has the focused state when this event fires.
    // We don't want to scroll the blurred editor into view, only the focused editor.
    setTimeout(delayedWork, 0);
  };

  isPeekableElement = (element: Element) => {
    if (
      !element.classList.contains("cm-m-javascript") ||
      element.classList.contains("binding-brackets")
    )
      return false;

    if (
      // global variables and functions
      // JsObject1, storeValue()
      element.classList.contains("cm-variable") ||
      // properties and function calls
      // JsObject.myFun(), Api1.data
      element.classList.contains("cm-property") ||
      // array indices - [0]
      element.classList.contains("cm-number") ||
      // string accessor - ["x"]
      element.classList.contains("cm-string")
    ) {
      return true;
    } else if (element.classList.contains("cm-keyword")) {
      // this keyword for jsObjects
      if (this.props.isJSObject && element.innerHTML === "this") {
        return true;
      }
    }
  };

  getBindingSnippetAtPos = (
    multiPlexConfig: MultiplexingModeConfig,
    pos: number,
  ) => {
    return multiPlexConfig.innerModes.map((innerMode) => {
      const doc = this.editor.getValue();
      const openPos =
        doc.lastIndexOf(innerMode.open, pos) + innerMode.open.length;
      const closePos = doc.indexOf(innerMode.close, pos);

      return {
        value: doc.slice(openPos, closePos),
        offset: openPos,
      };
    });
  };

  updateScriptForPeekOverlay = (chIndex: number) => {
    if (
      !this.peekOverlayExpressionIdentifier.hasParsedScript() ||
      this.multiplexConfig
    ) {
      if (this.multiplexConfig) {
        const bindingSnippetsByInnerMode = this.getBindingSnippetAtPos(
          this.multiplexConfig,
          chIndex,
        );

        for (const snippet of bindingSnippetsByInnerMode) {
          if (snippet.value) {
            this.peekOverlayExpressionIdentifier.updateScript(snippet.value);
            chIndex -= snippet.offset;
            break;
          }
        }
      } else {
        this.peekOverlayExpressionIdentifier.updateScript(
          this.editor.getValue(),
        );
      }
    }

    return chIndex;
  };

  isPathLibrary = (paths: string[]) => {
    return !!this.props.installedLibraries.find((installedLib) =>
      installedLib.accessor.find((accessor) => accessor === paths[0]),
    );
  };

  handleMouseOver = (event: MouseEvent) => {
    const tokenElement = event.target;
    const rect = (tokenElement as Element).getBoundingClientRect();

    if (
      !(rect.height === 0 && rect.width === 0) &&
      tokenElement instanceof Element &&
      this.isPeekableElement(tokenElement)
    ) {
      const tokenPos = this.editor.coordsChar({
        left: event.clientX,
        top: event.clientY,
      });
      const chIndex = this.updateScriptForPeekOverlay(
        this.editor.indexFromPos(tokenPos),
      );

      this.peekOverlayExpressionIdentifier
        .extractExpressionAtPosition(chIndex)
        .then((lineExpression: string) => {
          const paths = _.toPath(lineExpression);

          if (
            !this.isPathLibrary(paths) &&
            paths[0] in this.props.dynamicData
          ) {
            this.showPeekOverlay(lineExpression, paths, tokenElement);
          } else {
            this.hidePeekOverlay();
          }
        })
        .catch((e) => {
          this.hidePeekOverlay();
          debug(e);
        });
    } else {
      this.hidePeekOverlay();
    }
  };

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
    if (this.codeEditorTarget.current) {
      resizeObserver.unobserve(this.codeEditorTarget.current, [
        this.debounceEditorRefresh,
      ]);
    }

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
    this.editor.off("keydown", this.handleAutocompleteKeydown);
    this.editor.off("focus", this.handleEditorFocus);
    this.editor.off("cursorActivity", this.handleCursorMovement);
    this.editor.off("cursorActivity", this.debouncedArgHints);
    this.editor.off("blur", this.handleEditorBlur);
    this.editor.off("scrollCursorIntoView", this.handleScrollCursorIntoView);
    CodeMirror.off(
      this.editor.getWrapperElement(),
      "mousemove",
      this.debounceHandleMouseOver,
    );
    // @ts-expect-error: Types are not available
    this.editor.closeHint();

    CodeMirrorTernService.closeArgHints();
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
        /*
         * We only want focus to go out for code editors in JS pane with binding prompts
         * This is so the esc closes the binding prompt.
         * but this is not needed in the JS Object editor, since there are no prompts there
         * So we check for the following so the JS editor does not have this behaviour -
         * isFocused : editor is focused
         * hinterOpen : autocomplete hinter is closed
         * this.isBindingPromptOpen : binding prompt (type / for commands) is closed
         */
        if (
          this.state.isFocused &&
          !this.state.hinterOpen &&
          this.isBindingPromptOpen()
        ) {
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
    entitiesForNavigation: EntityNavigationData,
  ) {
    return hinting.map((helper) => {
      return helper(editor, entitiesForNavigation);
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

        if (
          document.activeElement &&
          document.activeElement instanceof HTMLElement
        ) {
          document.activeElement.blur();
        }

        this.setState({
          isFocused: false,
        });

        const { entitiesForNavigation } = this.props;
        const [documentName, ...navigationTargets] =
          navigationAttribute.value.split(".");

        if (documentName in entitiesForNavigation) {
          let navigationData = entitiesForNavigation[documentName];

          for (const navigationTarget of navigationTargets) {
            if (navigationTarget in navigationData.children) {
              navigationData = navigationData.children[navigationTarget];
            }
          }

          if (navigationData.url) {
            if (navigationData.type === ENTITY_TYPE.ACTION) {
              AnalyticsUtil.logEvent("EDIT_ACTION_CLICK", {
                actionId: navigationData?.id,
                datasourceId: navigationData?.datasourceId,
                pluginName: navigationData?.pluginName,
                actionType: navigationData?.actionType,
                isMock: !!navigationData?.isMock,
                from: NavigationMethod.CommandClick,
              });
            }

            history.push(navigationData.url, {
              invokedBy: NavigationMethod.CommandClick,
            });

            this.hidePeekOverlay();

            setTimeout(() => {
              cm.scrollIntoView(cm.getCursor());
            }, 0);
          }
        }
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
    const line = cm.getCursor().line;

    this.handleCustomGutter(line, true);

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

    if (!this.props.borderLess) return;

    if (this.currentLineNumber !== null) {
      cm.removeLineClass(
        this.currentLineNumber,
        "background",
        "CodeMirror-activeline-background",
      );
    }

    cm.addLineClass(line, "background", "CodeMirror-activeline-background");
    this.currentLineNumber = line;
  };

  handleEditorFocus = (cm: CodeMirror.Editor) => {
    this.props.setActiveField(this.props.dataTreePath || "");
    this.setState({ isFocused: true });
    const { sticky } = cm.getCursor();
    const isUserFocus = sticky !== null;

    if (this.props.editorLastCursorPosition) {
      if (
        !isUserFocus ||
        this.props.editorLastCursorPosition.origin ===
          CursorPositionOrigin.Navigation
      ) {
        cm.setCursor(this.props.editorLastCursorPosition, undefined, {
          scroll: true,
        });
      }
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
            hinter.showHint(cm, entityInformation, {
              blockCompletions,
              datasources: this.props.datasources.list,
              pluginIdToPlugin: this.props.pluginIdToPlugin,
              recentEntities: this.props.recentEntities,
              featureFlags: this.props.featureFlags,
              enableAIAssistance: this.AIEnabled,
              focusEditor: this.focusEditor,
              executeCommand: this.props.executeCommand,
              isJsEditor: this.props.mode === EditorModes.JAVASCRIPT,
            }),
        );
    }

    const value = this.editor?.getValue() || "";

    if (isDynamicValue(value)) {
      if (!this.state.isDynamic) {
        this.setState({
          isDynamic: true,
        });
      }
    } else {
      if (this.state.isDynamic) {
        this.setState({
          isDynamic: false,
        });
      }
    }

    if (this.props.onEditorFocus) {
      this.props.onEditorFocus();
    }
  };

  handleEditorBlur = (cm: CodeMirror.Editor, event: FocusEvent) => {
    if (event && event.relatedTarget instanceof Element) {
      if (event.relatedTarget.classList.contains("ai-trigger")) {
        return;
      }
    }

    this.props.resetActiveField();
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

    if (this.currentLineNumber !== null) {
      cm.removeLineClass(
        this.currentLineNumber,
        "background",
        "CodeMirror-activeline-background",
      );
      this.currentLineNumber = null;
    }

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

    // if the value is dynamic and the editor is not in dynamic state
    if (isDynamicValue(value)) {
      if (!this.state.isDynamic) {
        this.setState({
          isDynamic: true,
        });
      }
    } else {
      // if previously dynamic, set the editor dynamic state to false
      if (this.state.isDynamic) {
        this.setState({
          isDynamic: false,
        });
      }
    }

    if (this.editor && changeObj) {
      CodeEditor.updateMarkings(
        this.editor,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.props.marking!, // ! since defaultProps are set
        this.props.entitiesForNavigation,
        changeObj.from,
        changeObj.to,
      );
    }

    this.peekOverlayExpressionIdentifier.clearScript();

    // This will always open autocomplete dialog for table and json widgets' data properties
    if (!!instance) {
      const { propertyPath, widgetType } = this.getEntityInformation();

      if (shouldShowSlashCommandMenu(widgetType, propertyPath)) {
        setTimeout(() => {
          this.handleAutocompleteVisibility(instance);
        }, 10);
      }
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

    this.hidePeekOverlay();
    this.handleDebouncedChange(instance, changeObj);
  };

  getEntityInformation = (): FieldEntityInformation => {
    const { dataTreePath, expected } = this.props;
    const configTree = ConfigTreeActions.getConfigTree();
    let entityInformation: FieldEntityInformation = {
      expectedType: expected?.autocompleteDataType,
      example: expected?.example,
      mode: this.props.mode,
      isTriggerPath: false,
    };

    if (!dataTreePath) return entityInformation;

    const { entityName, propertyPath } =
      getEntityNameAndPropertyPath(dataTreePath);

    entityInformation.entityName = entityName;
    entityInformation.propertyPath = propertyPath;

    const entity = configTree[entityName];

    if (!entity) return entityInformation;

    if (!entity.ENTITY_TYPE) return entityInformation;

    const entityType = entity.ENTITY_TYPE;

    entityInformation.entityType = entityType;

    entityInformation = getEachEntityInformation[entityType](
      entity,
      entityInformation,
      propertyPath,
    );

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
        pluginIdToPlugin: this.props.pluginIdToPlugin,
        recentEntities: this.props.recentEntities,
        featureFlags: this.props.featureFlags,
        enableAIAssistance: this.AIEnabled,
        focusEditor: this.focusEditor,
        executeCommand: this.props.executeCommand,
        isJsEditor: this.props.mode === EditorModes.JAVASCRIPT,
      });

      if (hinterOpen) break;
    }

    this.setState({ hinterOpen });
  };

  handleAutocompleteKeydown = (cm: CodeMirror.Editor, event: KeyboardEvent) => {
    const key = event.key;

    // Since selection from AutoComplete list is also done using the Enter keydown event
    // we need to return from here so that autocomplete selection works fine
    if (key === "Enter" || this.props.ignoreAutoComplete) return;

    // Check if the user is trying to comment out the line, in that case we should not show autocomplete
    const isCtrlOrCmdPressed = event.metaKey || event.ctrlKey;

    const isAltKeyPressed = event.altKey;

    // If alt key is pressed, do not show autocomplete
    // Windows and Linux use Alt + Enter to add a new line
    // Alt key is used to enter non-english characters which are invalid entity names
    // So we can safely disable autocomplete when alt key is pressed
    if (isAltKeyPressed) return;

    if (isModifierKey(key)) return;

    const code = `${event.ctrlKey ? "Ctrl+" : ""}${event.code}`;

    if (isCloseKey(code) || isCloseKey(key)) {
      // @ts-expect-error: Types are not available
      cm.closeHint();

      return;
    }

    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const token = cm.getTokenAt(cursor);
    let showAutocomplete = false;
    const prevChar = line[cursor.ch - 1];

    // If the token is a comment or string, do not show autocomplete
    if (token?.type && ["comment", "string"].includes(token.type)) return;

    if (isCtrlOrCmdPressed) {
      // If cmd or ctrl is pressed only show autocomplete for space key
      showAutocomplete = key === " ";
    } else if (key === "/" && !this.props.ignoreSlashCommand) {
      showAutocomplete = true;
    } else if (event.code === "Backspace") {
      /* Check if the character before cursor is completable to show autocomplete which backspacing */
      showAutocomplete = !!prevChar && /[a-zA-Z_0-9.]/.test(prevChar);
    } else if (key === "{" && !this.props.ignoreBinding) {
      /* Autocomplete for { should show up only when a user attempts to write {{}} and not a code block. */
      showAutocomplete = prevChar === "{";
    } else if (key === "'" || key === '"') {
      /* Autocomplete for [ should show up only when a user attempts to write {['']} for Object property suggestions. */
      showAutocomplete = prevChar === "[";

      if (!showAutocomplete) {
        // @ts-expect-error: Types are not available
        cm.closeHint();
      }
    } else if (key.length == 1) {
      showAutocomplete = /[a-zA-Z_0-9.]/.test(key);
      /* Autocomplete should be triggered only for characters that make up valid variable names */
    }

    // Allow keydown event to enter the text to the editor before firing autocomplete
    // otherwise it'll not work for the first character
    setTimeout(() => {
      showAutocomplete && this.handleAutocompleteVisibility(cm);
    }, 10);
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

    if (this.props.customErrors?.length) {
      lintErrors.push(...this.props.customErrors);
    }

    this.annotations = getLintAnnotations(editor.getValue(), lintErrors, {
      isJSObject,
      contextData,
    });

    this.updateLintingCallback(editor, this.annotations);
  }

  static updateMarkings = (
    editor: CodeMirror.Editor,
    marking: Array<MarkHelper>,
    entityNavigationData: EntityNavigationData,
    from?: CodeMirror.Position,
    to?: CodeMirror.Position,
  ) => {
    marking.forEach((helper) => helper(editor, entityNavigationData, from, to));
  };

  focusEditor(focusOnline?: number, chOffset = 0) {
    const lineToFocus = isNumber(focusOnline)
      ? focusOnline
      : this.editor.lineCount() - 1;
    const focusedLineContent = this.editor.getLine(lineToFocus);

    this.editor.setCursor({
      line: lineToFocus,
      ch: focusedLineContent.length - chOffset,
    });

    this.setState({ isFocused: true }, () => {
      this.handleAutocompleteVisibility(this.editor);
    });
  }

  updatePropertyValue(value: string, focusOnline?: number, chOffset = 0) {
    this.editor.focus();

    if (value) {
      this.editor.setValue(value);
    }

    this.focusEditor(focusOnline, chOffset);
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
    isTriggerPath?: boolean,
  ): {
    evalErrors: EvaluationError[];
    pathEvaluatedValue: unknown;
  } => {
    if (!dataTreePath || !!isTriggerPath) {
      return {
        evalErrors: [],
        pathEvaluatedValue: undefined,
      };
    }

    const evalErrors = this.getErrors(this.props.dynamicData, dataTreePath);

    const pathEvaluatedValue = _.get(this.props.dynamicData, dataTreePath);

    return {
      evalErrors,
      pathEvaluatedValue,
    };
  };

  // show features like evaluatedvaluepopup or binding prompts
  showFeatures = () => {
    return (
      this.state.isFocused &&
      !this.props.hideEvaluatedValue &&
      ("evaluatedValue" in this.props ||
        ("dataTreePath" in this.props && !!this.props.dataTreePath))
    );
  };

  isBindingPromptOpen = () => {
    const completionActive = _.get(this.editor, "state.completionActive");

    return (
      showBindingPrompt(
        this.showFeatures(),
        this.props.input.value,
        this.state.hinterOpen,
      ) && !completionActive
    );
  };

  updateValueWithAIResponse = (value: string) => {
    if (typeof value !== "string") return;

    this.props.input?.onChange?.(value);
    this.editor.setValue(value);
  };

  render() {
    const {
      border,
      borderLess,
      className,
      codeEditorVisibleOverflow,
      dataTreePath,
      disabled,
      evaluatedPopUpLabel,
      evaluatedValue,
      evaluationSubstitutionType,
      expected,
      fill,
      height,
      hideEvaluatedValue,
      hoverInteraction,
      maxHeight,
      showLightningMenu,
      size,
      theme,
      useValidationMessage,
    } = this.props;

    const entityInformation = this.getEntityInformation();

    const { evalErrors, pathEvaluatedValue } = this.getPropertyValidation(
      dataTreePath,
      entityInformation?.isTriggerPath,
    );

    let errors = evalErrors,
      isInvalid = evalErrors.length > 0,
      evaluated = evaluatedValue;

    if (dataTreePath) {
      evaluated =
        pathEvaluatedValue !== undefined ? pathEvaluatedValue : evaluated;
    }

    const showSlashCommandButton =
      showLightningMenu !== false &&
      !this.state.isFocused &&
      !this.state.showAIWindow;

    /* Evaluation results for snippet arguments. The props below can be used to set the validation errors when computed from parent component */
    if (this.props.errors) {
      errors = this.props.errors;
    }

    if (this.props.isInvalid !== undefined) {
      isInvalid = Boolean(this.props.isInvalid);
    }

    const showEvaluatedValue =
      this.showFeatures() &&
      (this.state.isDynamic || isInvalid) &&
      !this.state.showAIWindow &&
      !this.state.peekOverlayProps &&
      !this.editor.state.completionActive &&
      !this.state.ternToolTipActive;

    return (
      <DynamicAutocompleteInputWrapper
        className="t--code-editor-wrapper codeWrapper"
        isActive={(this.state.isFocused && !isInvalid) || this.state.isOpened}
        isError={isInvalid}
        isNotHover={this.state.isFocused || this.state.isOpened}
        skin={this.props.theme === EditorTheme.DARK ? Skin.DARK : Skin.LIGHT}
      >
        <div className="flex absolute gap-1 top-[6px] right-[6px] z-4 justify-center">
          <Button
            className={classNames(
              "commands-button invisible",
              !showSlashCommandButton && "!hidden",
            )}
            isIconButton
            kind="tertiary"
            onClick={() => {
              const newValue =
                typeof this.props.input.value === "string"
                  ? this.props.input.value + "/"
                  : "/";

              this.updatePropertyValue(newValue);
            }}
            size="sm"
            tabIndex={-1}
          >
            /
          </Button>
        </div>

        <div className="absolute bottom-[6px] right-[6px] z-4">
          <AskAIButton
            entity={entityInformation}
            mode={this.props.mode}
            onClick={() => {
              this.setState({ showAIWindow: true });
            }}
          />
        </div>

        <EvaluatedValuePopup
          dataTreePath={this.props.dataTreePath}
          editorRef={this.codeEditorTarget}
          entity={entityInformation}
          errors={errors}
          evaluatedPopUpLabel={evaluatedPopUpLabel}
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
          <AIWindow
            currentValue={this.props.input.value}
            dataTreePath={dataTreePath}
            editor={this.editor}
            enableAIAssistance={this.AIEnabled}
            entitiesForNavigation={this.props.entitiesForNavigation}
            entity={entityInformation}
            isOpen={this.state.showAIWindow}
            mode={this.props.mode}
            onOpenChanged={(showAIWindow: boolean) => {
              this.setState({ showAIWindow });
            }}
            triggerContext={this.props.expected}
            update={this.updateValueWithAIResponse}
          >
            <EditorWrapper
              AIEnabled
              border={border}
              borderLess={borderLess}
              className={`${className} ${replayHighlightClass} ${
                isInvalid ? "t--codemirror-has-error" : ""
              } w-full`}
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
              maxHeight={maxHeight}
              mode={this.props.mode}
              onMouseMove={this.handleLintTooltip}
              onMouseOver={this.handleMouseMove}
              ref={this.editorWrapperRef}
              removeHoverAndFocusStyle={this.props?.removeHoverAndFocusStyle}
              showFocusVisible={!this.props.isJSObject}
              size={size}
            >
              {this.state.peekOverlayProps && (
                <PeekOverlayPopUp
                  hidePeekOverlay={() => this.hidePeekOverlay()}
                  {...this.state.peekOverlayProps}
                />
              )}
              {this.props.leftIcon && (
                <IconContainer>{this.props.leftIcon}</IconContainer>
              )}

              {this.props.leftImage && (
                <img
                  alt="img"
                  className="leftImageStyles"
                  src={getAssetUrl(this.props.leftImage)}
                />
              )}
              <div
                className="CodeEditorTarget"
                data-testid="code-editor-target"
                ref={this.codeEditorTarget}
                tabIndex={0}
              >
                <CodeEditorSignPosting
                  editorTheme={this.props.theme}
                  forComp="editor"
                  isOpen={this.isBindingPromptOpen()}
                  mode={this.props.mode}
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
            </EditorWrapper>
          </AIWindow>
        </EvaluatedValuePopup>
      </DynamicAutocompleteInputWrapper>
    );
  }
}

const mapStateToProps = (state: AppState, props: EditorProps) => {
  const currentPageId: string = getCurrentPageId(state);
  let entitiesForNavigation: EntityNavigationData = {};

  if (currentPageId) {
    entitiesForNavigation = getEntitiesForNavigation(
      state,
      props.dataTreePath?.split(".")[0],
    );
  }

  return {
    dynamicData: getDataTreeForAutocomplete(state),
    datasources: state.entities.datasources,
    pluginIdToPlugin: getPluginIdToPlugin(state),
    recentEntities: getRecentEntityIds(state),
    lintErrors: getEntityLintErrors(state, props.dataTreePath),
    editorIsFocused: getIsInputFieldFocused(state, getEditorIdentifier(props)),
    editorLastCursorPosition: getCodeEditorLastCursorPosition(
      state,
      getEditorIdentifier(props),
    ),
    entitiesForNavigation,
    featureFlags: selectFeatureFlags(state),
    datasourceTableKeys: getAllDatasourceTableKeys(state, props.dataTreePath),
    installedLibraries: selectInstalledLibraries(state),
    focusedProperty: getFocusablePropertyPaneField(state),
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  executeCommand: (payload: SlashCommandPayload) =>
    dispatch(executeCommandAction(payload)),
  startingEntityUpdate: () => dispatch(startingEntityUpdate()),
  setCodeEditorLastFocus: (payload: CodeEditorFocusState) =>
    dispatch(setEditorFieldFocusAction(payload)),
  setActiveField: (path: string) => dispatch(setActiveEditorField(path)),
  resetActiveField: () => dispatch(resetActiveEditorField()),
});

export default Sentry.withProfiler(
  connect(mapStateToProps, mapDispatchToProps)(CodeEditor),
);
