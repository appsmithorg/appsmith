import React from "react-redux";
import { DebuggerEntityLink, type EntityLinkProps } from "./DebuggerEntityLink";
import { useCallback } from "react";
import useSettings from "git/hooks/useSettings";
import { GitSettingsTab } from "git/constants/enums";

export default function GitEntityLink(props: EntityLinkProps) {
  const { toggleSettingsModal } = useSettings();

  const onClick = useCallback(() => {
    toggleSettingsModal(true, GitSettingsTab.General);
  }, [toggleSettingsModal]);

  return (
    <DebuggerEntityLink
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}
