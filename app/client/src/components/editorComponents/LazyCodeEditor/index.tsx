import React, { useState, useEffect, useRef, useCallback } from "react";
import { LazyEditorWrapper } from "./styles";
import { REQUEST_IDLE_CALLBACK_TIMEOUT } from "constants/AppConstants";
import type {
  EditorProps,
  EditorStyleProps,
} from "components/editorComponents/CodeEditor";
import type CodeEditor from "components/editorComponents/CodeEditor";
import CodeEditorFallback from "./CodeEditorFallback";
import { CODE_EDITOR_LOADING_ERROR } from "ee/constants/messages";
import assertNever from "assert-never/index";
import log from "loglevel";
import { toast } from "@appsmith/ads";

let CachedCodeEditor: typeof CodeEditor | undefined;

type LazyCodeEditorState =
  // The initial state when the state machine is initialized
  | "idle"
  // The state when the CodeEditor chunk is loading
  | "loading"
  // The state when the CodeEditor chunk is loading, but the user has interacted with the placeholder
  | "loading-interacted"
  // The state when we’re waiting for the idle callback to fire to render CodeEditor
  | "waiting-idle-callback"
  // The state when the CodeEditor must be rendered
  | "active"
  // The state when the CodeEditor must be rendered and made focused
  | "active-focused"
  // The state when the CodeEditor chunk failed to load
  | "error";

type LazyCodeEditorEvent =
  | "RENDERED"
  | "LOADING_FINISHED"
  | "LOADING_ERRORED"
  | "IDLE_CALLBACK_FIRED"
  | "PLACEHOLDER_INTERACTED";

/**
 * A state machine that manages the lifecycle of the CodeEditor chunk.
 * It’s implemented outside the component to avoid firing unnecessary re-renders
 * when the state changes.
 */
class LazyCodeEditorStateMachine {
  private state: LazyCodeEditorState;
  private idleCallbackId: number | null = null;
  private stateChangeListeners: ((state: LazyCodeEditorState) => void)[] = [];

  constructor(stateChangeListener: (state: LazyCodeEditorState) => void) {
    this.state = "idle";
    void this.handleStateChange();
    this.stateChangeListeners.push(stateChangeListener);
  }

  /** This method transitions the state machine to a new state based on the current state
   * and (possibly) other conditions. It’s intended to not have any side effects –
   * all side effects should go into this.handleStateChange() */
  transition(event: LazyCodeEditorEvent) {
    switch (this.state) {
      case "idle":
        if (event === "RENDERED") {
          if (CachedCodeEditor) {
            this.state = "waiting-idle-callback";
          } else {
            this.state = "loading";
          }
        }
        break;
      case "loading":
        if (event === "LOADING_FINISHED") {
          this.state = "waiting-idle-callback";
        } else if (event === "PLACEHOLDER_INTERACTED") {
          this.state = "loading-interacted";
        }
        break;
      case "loading-interacted":
        if (event === "LOADING_FINISHED") {
          this.state = "active-focused";
        }
        break;
      case "waiting-idle-callback":
        if (event === "IDLE_CALLBACK_FIRED") {
          this.state = "active";
        }
        if (event === "PLACEHOLDER_INTERACTED") {
          this.state = "active-focused";
        }
        break;
      case "active":
        break;
      case "active-focused":
        break;
      case "error":
        break;
      default:
        assertNever(this.state);
    }

    void this.handleStateChange();
  }

  /** This method runs side effects when a state transition happens. */
  private async handleStateChange() {
    this.stateChangeListeners.forEach((listener) => listener(this.state));

    switch (this.state) {
      case "idle":
        break;

      case "loading":
        try {
          const codeEditorModule = await import(
            "components/editorComponents/CodeEditor"
          );
          // Once CodeEditor loads, save it, so we can render it synchronously in the future
          CachedCodeEditor = codeEditorModule.default;
          this.transition("LOADING_FINISHED");
        } catch (error) {
          log.error(error);
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          toast.show(CODE_EDITOR_LOADING_ERROR((error as any).message), {
            kind: "error",
          });
          this.transition("LOADING_ERRORED");
        }
        break;

      case "loading-interacted":
        break;

      case "waiting-idle-callback":
        this.idleCallbackId = window.requestIdleCallback(
          () => {
            this.transition("IDLE_CALLBACK_FIRED");
          },
          { timeout: REQUEST_IDLE_CALLBACK_TIMEOUT.highPriority },
        );
        break;

      case "active":
      case "active-focused":
      case "error":
        if (this.idleCallbackId) {
          window.cancelIdleCallback(this.idleCallbackId);
        }
        break;

      default:
        assertNever(this.state);
    }
  }
}

/**
 * A wrapper to load and lazily render the CodeEditor component on demand.
 *
 * - Why load on demand: CodeEditor is a large chunk of the bundle, so we want to load it only when needed.
 *
 * - Why lazily render: CodeMirror is a performance intensive component to render.
 *     Many widgets have multiple properties that require a CodeEditor component to be rendered.
 *     Solution:
 *     1. Lazy load the CodeEditor component when the system is idle.
 *     2. Render a similar looking replica component initially.
 *     3. If there isn't enough idle time to render the CodeEditor component,
 *        then render it immediately upon focus event.
 */
function LazyCodeEditor({
  input,
  onLoad,
  placeholder,
  ...otherProps
}: EditorProps &
  EditorStyleProps & {
    onLoad?: () => void;
  }) {
  const [renderTarget, setRenderTarget] = useState<
    "editor" | "editor-focused" | "fallback"
  >("fallback");
  const [showLoadingProgress, setShowLoadingProgress] = useState(false);

  const stateMachine = useRef(
    new LazyCodeEditorStateMachine((state) => {
      if (state === "active") {
        setRenderTarget("editor");
      }

      if (state === "active-focused") {
        setRenderTarget("editor-focused");
      }

      if (state === "loading-interacted") {
        setShowLoadingProgress(true);
      }
    }),
  );

  useEffect(() => {
    stateMachine.current.transition("RENDERED");
  }, []);

  const editorWrapperRef = useCallback(
    (editorWrapper: HTMLDivElement) => {
      if (editorWrapper && renderTarget === "editor-focused") {
        const editor = editorWrapper.querySelector(
          ".CodeEditorTarget",
        ) as HTMLElement | null;
        if (editor) {
          editor.focus();
        }
      }
    },
    [renderTarget],
  );

  useEffect(() => {
    if (
      (renderTarget === "editor" || renderTarget === "editor-focused") &&
      CachedCodeEditor
    ) {
      onLoad?.();
    }
  }, [renderTarget, CachedCodeEditor, onLoad]);

  if (renderTarget === "editor" || renderTarget === "editor-focused") {
    if (!CachedCodeEditor)
      throw new Error(
        "CodeEditor is not loaded. This is likely an issue with the state machine.",
      );

    return (
      <LazyEditorWrapper
        className="t--lazyCodeEditor-editor"
        ref={editorWrapperRef}
      >
        <CachedCodeEditor
          input={input}
          placeholder={placeholder}
          {...otherProps}
        />
      </LazyEditorWrapper>
    );
  }

  if (renderTarget === "fallback") {
    return (
      <LazyEditorWrapper className="t--lazyCodeEditor-fallback">
        <CodeEditorFallback
          borderLess={otherProps.borderLess}
          height={otherProps?.height}
          input={input}
          isReadOnly={otherProps.isReadOnly}
          onInteracted={() => {
            stateMachine.current.transition("PLACEHOLDER_INTERACTED");
          }}
          placeholder={placeholder}
          showLineNumbers={otherProps.showLineNumbers}
          showLoadingProgress={showLoadingProgress}
        />
      </LazyEditorWrapper>
    );
  }

  throw new Error(`Invalid render target: ${renderTarget}`);
}

export default LazyCodeEditor;
