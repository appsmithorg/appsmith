export * from "ce/components/editorComponents/GPT";

import React, { useEffect } from "react";
import { AskAI } from "./AskAI";
import type { TAIWrapperProps } from "ce/components/editorComponents/GPT";
import { type Placement, Popover2 } from "@blueprintjs/popover2";
import { editorSQLModes } from "components/editorComponents/CodeEditor/sql/config";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { useSelector } from "react-redux";
import { APPSMITH_AI } from "./trigger";
import { getJSFunctionStartLineFromCode } from "pages/Editor/JSEditor/utils";
import { AI_PLACEHOLDER_CLASSNAME, AI_PLACEHOLDER_TEXT } from "./constants";

export function AIWindow(props: TAIWrapperProps) {
  if (!props.enableAIAssistance) {
    //eslint-disable-next-line
    return <>{props.children}</>;
  }
  return <FloatingAIWindow {...props} />;
}

function FloatingAIWindow(props: TAIWrapperProps) {
  const { editor, enableAIAssistance, mode, onOpenChanged } = props;
  const { cursorCoordinates, cursorPosition } = useSelector(
    (state) => state.ai.context,
  );

  const handleClose = () => {
    if (props.mode === EditorModes.JAVASCRIPT && cursorPosition) {
      props.editor?.focus();
      const currentLine = editor.getLine(cursorPosition.line);
      const startOfLine = currentLine.length - currentLine.trim().length;
      props.editor.setCursor({
        line: cursorPosition.line,
        ch: startOfLine,
      });
    }

    onOpenChanged(false);
  };

  const handleAICommandPostPick = (...args: any) => {
    const [command] = args;
    if (command === APPSMITH_AI) {
      onOpenChanged(true);
    }
  };

  const clearExistingAIPlaceholder = () => {
    const prevPlaceholders = editor
      .getWrapperElement()
      .getElementsByClassName(AI_PLACEHOLDER_CLASSNAME);

    if (prevPlaceholders.length) {
      for (const placeholder of prevPlaceholders) {
        placeholder.remove();
      }
    }
  };

  const showAIPlaceholder = () => {
    if (!enableAIAssistance) {
      return;
    }

    if (mode !== EditorModes.JAVASCRIPT) {
      return;
    }

    const currentCursorPos = editor.getCursor();
    const { actionName: functionName } =
      getJSFunctionStartLineFromCode(
        editor.getValue(),
        currentCursorPos.line,
      ) || {};

    clearExistingAIPlaceholder();

    if (functionName) {
      const cursor = editor.getCursor();

      const line = editor.getLine(cursor.line);
      if (line.trim() === "") {
        const pos = { line: cursor.line, ch: cursor.ch };
        const placeholderElem = document.createElement("span");
        placeholderElem.className = AI_PLACEHOLDER_CLASSNAME;
        placeholderElem.textContent = AI_PLACEHOLDER_TEXT;
        placeholderElem.style.marginTop = "-21px";
        placeholderElem.style.marginLeft = "3px";
        placeholderElem.style.color = "var(--ads-v2-color-gray-400)";

        editor.addWidget(pos, placeholderElem, false);
      }
    }
  };

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.on("postPick", handleAICommandPostPick);
    editor.on("change", showAIPlaceholder);
    editor.on("cursorActivity", showAIPlaceholder);
    editor.on("blur", clearExistingAIPlaceholder);

    return () => {
      editor.off("postPick", handleAICommandPostPick);
      editor.off("change", showAIPlaceholder);
      editor.off("cursorActivity", showAIPlaceholder);
      editor.off("blur", clearExistingAIPlaceholder);
    };
  }, [editor]);

  if (mode === EditorModes.JAVASCRIPT) {
    const editorWrapper = editor?.getWrapperElement();
    const { width = 0 } = editorWrapper?.getBoundingClientRect() || {};
    const { left: cursorLeft = 0, top: cursorTop = 0 } =
      cursorCoordinates || {};
    const popupOffsetX =
      cursorLeft + 47 + 520 > width ? cursorLeft + 47 : cursorLeft + 47 + 520;
    const popupOffsetY = cursorTop + 21;

    return (
      <Popover2
        autoFocus={false}
        className="w-full"
        content={
          <AskAI
            close={handleClose}
            currentValue={props.currentValue}
            dataTreePath={props.dataTreePath}
            editor={props.editor}
            entitiesForNavigation={props.entitiesForNavigation}
            entity={props.entity}
            isOpen={props.isOpen}
            mode={props.mode}
            triggerContext={props.triggerContext}
            update={props.update}
          />
        }
        enforceFocus={false}
        isOpen={props.isOpen}
        minimal
        modifiers={{
          preventOverflow: {
            enabled: true,
          },
          offset: {
            enabled: true,
            options: {
              offset: [popupOffsetY, -popupOffsetX],
            },
          },
        }}
        onClose={handleClose}
        placement="left-start"
        popoverClassName="w-[520px]"
        portalClassName="ai-window"
      >
        {props.children}
      </Popover2>
    );
  }

  const popoverClassName =
    props.mode === editorSQLModes.POSTGRESQL_WITH_BINDING
      ? "w-[520px]"
      : "w-[400px] !translate-x-[-21px]";

  const placement: Placement =
    props.mode === editorSQLModes.POSTGRESQL_WITH_BINDING
      ? "bottom-end"
      : "left-start";

  return (
    <Popover2
      autoFocus={false}
      className="w-full"
      content={
        <AskAI
          close={handleClose}
          currentValue={props.currentValue}
          dataTreePath={props.dataTreePath}
          editor={props.editor}
          entitiesForNavigation={props.entitiesForNavigation}
          entity={props.entity}
          isOpen={props.isOpen}
          mode={props.mode}
          triggerContext={props.triggerContext}
          update={props.update}
        />
      }
      enforceFocus={false}
      isOpen={props.isOpen}
      minimal
      modifiers={{
        preventOverflow: {
          enabled: true,
        },
      }}
      onClose={handleClose}
      placement={placement}
      popoverClassName={popoverClassName}
      portalClassName="ai-window"
    >
      {props.children}
    </Popover2>
  );
}
