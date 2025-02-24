import React from "react";
import { Icon, Text } from "@appsmith/ads";
import {
  NOT_PUSHED_YET,
  TRY_TO_PULL,
  createMessage,
} from "ee/constants/messages";
import styled from "styled-components";
import type { GitStatusData } from "reducers/uiReducers/gitSyncTypes";

const TitleText = styled(Text)`
  font-weight: 500;
`;

export enum StaticChangeKind {
  SETTINGS = "SETTINGS",
  THEME = "THEME",
  MODULES = "MODULES",
  REMOTE_AHEAD = "REMOTE_AHEAD",
  REMOTE_BEHIND = "REMOTE_BEHIND",
}

interface StaticChangeDef {
  condition: boolean;
  message: string;
  iconName: string;
}

const allStaticChangeDefs: Record<
  StaticChangeKind,
  (status: GitStatusData) => StaticChangeDef
> = {
  [StaticChangeKind.REMOTE_AHEAD]: (status: GitStatusData) => ({
    condition: (status.aheadCount ?? 0) > 0,
    message: `${status.aheadCount ?? 0} ${
      (status.aheadCount ?? 0) > 0 ? "commits" : "commit"
    } ahead. ${createMessage(NOT_PUSHED_YET)}`,
    iconName: "git-commit",
  }),

  [StaticChangeKind.REMOTE_BEHIND]: (status: GitStatusData) => ({
    condition: (status.behindCount ?? 0) > 0,
    message: `${status.behindCount ?? 0} ${
      (status.behindCount ?? 0) > 0 ? "commits" : "commit"
    } behind. ${createMessage(TRY_TO_PULL)}`,
    iconName: "git-commit",
  }),
  [StaticChangeKind.SETTINGS]: (status: GitStatusData) => ({
    condition: status.modified.includes("application.json"),
    message: "Application settings modified",
    iconName: "settings-v3",
  }),
  [StaticChangeKind.THEME]: (status: GitStatusData) => ({
    condition: status.modified.includes("theme.json"),
    message: "Theme modified",
    iconName: "sip-line",
  }),
  [StaticChangeKind.MODULES]: (status: GitStatusData) => ({
    condition: (status.modifiedSourceModules ?? 0) > 0,
    message: `${status.modifiedSourceModules ?? 0} ${
      (status.modifiedSourceModules ?? 0) > 0 ? "modules" : "module"
    } modified`,
    iconName: "package",
  }),
};

interface StaticChangeProps {
  kind: StaticChangeKind;
  status: GitStatusData;
}

export default function StaticChange({ kind, status }: StaticChangeProps) {
  const { condition, iconName, message } = allStaticChangeDefs[kind](status);

  if (!condition) {
    return null;
  }

  return (
    <div
      className="flex items-center space-x-1.5"
      data-testid={`t--status-change-${kind}`}
    >
      {iconName && (
        <Icon color={"var(--ads-v2-color-fg)"} name={iconName} size="md" />
      )}
      <TitleText color={"var(--ads-v2-color-fg)"}>{message}</TitleText>
    </div>
  );
}
