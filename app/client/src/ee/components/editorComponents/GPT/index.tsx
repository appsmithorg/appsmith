export * from "ce/components/editorComponents/GPT";

import React from "react";
import { AskAI } from "./AskAI";
import type { TAIWrapperProps } from "ce/components/editorComponents/GPT";
import { Popover2 } from "@blueprintjs/popover2";
import { editorSQLModes } from "components/editorComponents/CodeEditor/sql/config";

export function AIWindow(props: TAIWrapperProps) {
  if (!props.enableAIAssistance) {
    //eslint-disable-next-line
    return <>{props.children}</>;
  }
  return <FloatingAIWindow {...props} />;
}

function FloatingAIWindow(props: TAIWrapperProps) {
  const popoverClassName =
    props.mode === editorSQLModes.POSTGRESQL_WITH_BINDING
      ? "w-[520px]"
      : "w-[480px] !translate-x-[-21px]";

  const placement =
    props.mode === editorSQLModes.POSTGRESQL_WITH_BINDING
      ? "bottom-end"
      : "left-start";

  return (
    <Popover2
      autoFocus={false}
      className="w-full"
      content={
        <AskAI
          close={props.close}
          currentValue={props.currentValue}
          dataTreePath={props.dataTreePath}
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
      placement={placement}
      popoverClassName={popoverClassName}
      portalClassName="ai-window"
    >
      {props.children}
    </Popover2>
  );
}
