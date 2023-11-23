import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import {
  getGitRemoteStatus,
  getGitStatus,
  getIsFetchingGitStatus,
  getIsFetchingGitRemoteStatus,
  getIsGitStatusLiteEnabled,
} from "selectors/gitSyncSelectors";
import type { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import {
  CHANGES_APP_SETTINGS,
  CHANGES_FROM_APPSMITH,
  CHANGES_THEME,
  createMessage,
  NOT_PUSHED_YET,
  TRY_TO_PULL,
} from "@appsmith/constants/messages";
import { getCurrentApplication } from "selectors/editorSelectors";
import { changeInfoSinceLastCommit } from "../utils";
import { Callout, Icon, Text } from "design-system";

const DummyChange = styled.div`
  width: 50%;
  height: ${(props) => props.theme.spaces[9]}px;
  background: linear-gradient(
    90deg,
    ${Colors.GREY_2} 0%,
    rgba(240, 240, 240, 0) 100%
  );
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const Wrapper = styled.div`
  height: ${(props) => props.theme.spaces[9]}px;
  margin-bottom: var(--ads-v2-spaces-3);
  display: flex;
  gap: 6px;
`;

const CalloutContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
`;

const Changes = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

export enum Kind {
  AHEAD_COMMIT = "AHEAD_COMMIT",
  BEHIND_COMMIT = "BEHIND_COMMIT",
  DATA_SOURCE = "DATA_SOURCE",
  JS_OBJECT = "JS_OBJECT",
  PAGE = "PAGE",
  QUERY = "QUERY",
  JS_LIB = "JS_LIB",
  THEME = "THEME",
  SETTINGS = "SETTINGS",
}

interface GitStatusProps {
  iconName: string;
  message: string;
  hasValue: boolean;
}

type GitStatusMap = {
  [key in Kind]: (status: Partial<GitStatusData>) => GitStatusProps;
};

const STATUS_MAP: GitStatusMap = {
  [Kind.AHEAD_COMMIT]: (status) => ({
    message: aheadCommitMessage(status),
    iconName: "git-commit",
    hasValue: (status?.aheadCount || 0) > 0,
  }),
  [Kind.BEHIND_COMMIT]: (status) => ({
    message: behindCommitMessage(status),
    iconName: "git-commit",
    hasValue: (status?.behindCount || 0) > 0,
  }),
  [Kind.SETTINGS]: (status) => ({
    message: createMessage(CHANGES_APP_SETTINGS),
    iconName: "settings-2-line",
    hasValue: (status?.modified || []).includes("application.json"),
  }),
  [Kind.THEME]: (status) => ({
    message: createMessage(CHANGES_THEME),
    iconName: "sip-line",
    hasValue: (status?.modified || []).includes("theme.json"),
  }),
  [Kind.DATA_SOURCE]: (status) => ({
    message: `${status?.modifiedDatasources || 0} ${
      status?.modifiedDatasources || 0 ? "datasource" : "datasources"
    } modified`,
    iconName: "database-2-line",
    hasValue: (status?.modifiedDatasources || 0) > 0,
  }),
  [Kind.JS_OBJECT]: (status) => ({
    message: `${status?.modifiedJSObjects || 0} JS ${
      (status?.modifiedJSObjects || 0) <= 1 ? "Object" : "Objects"
    } modified`,
    iconName: "js",
    hasValue: (status?.modifiedJSObjects || 0) > 0,
  }),
  [Kind.PAGE]: (status) => ({
    message: `${status?.modifiedPages || 0} ${
      (status?.modifiedPages || 0) <= 1 ? "page" : "pages"
    } modified`,
    iconName: "widget",
    hasValue: (status?.modifiedPages || 0) > 0,
  }),
  [Kind.QUERY]: (status) => ({
    message: `${status?.modifiedQueries || 0} ${
      (status?.modifiedQueries || 0) <= 1 ? "query" : "queries"
    } modified`,
    iconName: "query",
    hasValue: (status?.modifiedQueries || 0) > 0,
  }),
  [Kind.JS_LIB]: (status) => ({
    message: `${status?.modifiedJSLibs || 0} ${
      (status?.modifiedJSLibs || 0) <= 1 ? "library" : "libraries"
    } modified`,
    iconName: "package",
    hasValue: (status?.modifiedJSLibs || 0) > 0,
  }),
};

function behindCommitMessage(status: Partial<GitStatusData>) {
  const behindCount = status?.behindCount || 0;
  let behindMessage =
    (behindCount || 0) === 1
      ? `${behindCount || 0} commit`
      : `${behindCount || 0} commits`;
  behindMessage += ` behind. ${createMessage(TRY_TO_PULL)}`;
  return behindMessage;
}

function aheadCommitMessage(status: Partial<GitStatusData>) {
  const aheadCount = status?.aheadCount || 0;
  let aheadMessage =
    (aheadCount || 0) === 1
      ? `${aheadCount || 0} commit`
      : `${aheadCount || 0} commits`;
  aheadMessage += ` ahead. ${createMessage(NOT_PUSHED_YET)}`;
  return aheadMessage;
}

export function Change(props: Partial<GitStatusProps>) {
  const { iconName = "git-commit", message } = props;

  return (
    <Wrapper>
      {iconName && (
        <Icon color={"var(--ads-v2-color-fg)"} name={iconName} size="md" />
      )}
      <Text color={"var(--ads-v2-color-fg)"} kind="body-s">
        {message}
      </Text>
    </Wrapper>
  );
}

const defaultStatus: GitStatusData = {
  aheadCount: 0,
  behindCount: 0,
  conflicting: [],
  discardDocUrl: "",
  isClean: false,
  modified: [],
  modifiedDatasources: 0,
  modifiedJSObjects: 0,
  modifiedPages: 0,
  modifiedJSLibs: 0,
  modifiedQueries: 0,
  remoteBranch: "",
};

/**
 * gitChangeListData: accepts a git status
 * @param status {GitStatusData} status object that contains git-status call result from backend
 * @returns {JSX.Element[]}
 */
export function gitChangeListData(
  status: Partial<GitStatusData> = defaultStatus,
): JSX.Element[] {
  const changeKind = [
    Kind.SETTINGS,
    Kind.THEME,
    Kind.PAGE,
    Kind.QUERY,
    Kind.JS_OBJECT,
    Kind.DATA_SOURCE,
    Kind.JS_LIB,
  ];
  return changeKind
    .map((type: Kind) => STATUS_MAP[type](status))
    .filter((s: GitStatusProps) => s.hasValue)
    .map((s) => <Change {...s} key={`change-status-${s.iconName}`} />)
    .filter((s) => !!s);
}

/**
 * gitRemoteChangeListData: accepts a git status
 * @param status {GitStatusData} status object that contains git-status call result from backend
 * @returns {JSX.Element[]}
 */
export function gitRemoteChangeListData(
  status: Partial<GitStatusData> = defaultStatus,
): JSX.Element[] {
  const changeKind = [Kind.AHEAD_COMMIT, Kind.BEHIND_COMMIT];
  return changeKind
    .map((type: Kind) => STATUS_MAP[type](status))
    .filter((s: GitStatusProps) => s.hasValue)
    .map((s) => <Change {...s} key={`change-status-${s.iconName}`} />)
    .filter((s) => !!s);
}

export default function GitChangesList() {
  const status = useSelector(getGitStatus);
  const remoteStatus = useSelector(getGitRemoteStatus);
  const isGitStatusLiteEnabled = useSelector(getIsGitStatusLiteEnabled);

  const derivedStatus: Partial<GitStatusData> = {
    ...status,
    aheadCount: isGitStatusLiteEnabled
      ? remoteStatus?.aheadCount
      : status?.aheadCount,
    behindCount: isGitStatusLiteEnabled
      ? remoteStatus?.behindCount
      : status?.behindCount,
    remoteBranch: isGitStatusLiteEnabled
      ? remoteStatus?.remoteTrackingBranch
      : status?.remoteBranch,
  };

  const statusLoading = useSelector(getIsFetchingGitStatus);
  const remoteStatusLoading = useSelector(getIsFetchingGitRemoteStatus);

  const statusChanges = gitChangeListData(derivedStatus);
  const remoteStatusChanges = gitRemoteChangeListData(derivedStatus);

  const currentApplication = useSelector(getCurrentApplication);
  const { isAutoUpdate } = changeInfoSinceLastCommit(currentApplication);
  if (isAutoUpdate && !status?.isClean) {
    statusChanges.push(
      <Change
        hasValue={isAutoUpdate}
        iconName="info"
        key="change-status-auto-update"
        message={createMessage(CHANGES_FROM_APPSMITH)}
      />,
    );
  }
  return isGitStatusLiteEnabled ? (
    <>
      <Changes data-testid={"t--git-change-statuses"}>
        {!statusLoading ? statusChanges : null}
        {!remoteStatusLoading ? remoteStatusChanges : null}
        {status?.migrationMessage ? (
          <CalloutContainer>
            <Callout kind="info">{status.migrationMessage}</Callout>
          </CalloutContainer>
        ) : null}
      </Changes>
      {statusLoading || remoteStatusLoading ? (
        <DummyChange data-testid={"t--git-change-loading-dummy"} />
      ) : null}
    </>
  ) : (
    // disabling for better redability
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {statusLoading ? (
        <DummyChange data-testid={"t--git-change-loading-dummy"} />
      ) : statusChanges.length ? (
        <Changes data-testid={"t--git-change-statuses"}>
          {statusChanges}
          {status?.migrationMessage ? (
            <CalloutContainer>
              <Callout kind="info">{status.migrationMessage}</Callout>
            </CalloutContainer>
          ) : null}
        </Changes>
      ) : null}
    </>
  );
}
