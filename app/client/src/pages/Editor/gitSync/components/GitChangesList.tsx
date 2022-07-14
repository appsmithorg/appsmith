import React from "react";
import styled from "constants/DefaultTheme";
import { Classes } from "components/ads/common";
import Icon, { IconSize } from "components/ads/Icon";
import { Text, TextType } from "design-system";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import {
  CHANGES_FROM_APPSMITH,
  createMessage,
  NOT_PUSHED_YET,
  TRY_TO_PULL,
} from "@appsmith/constants/messages";

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
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  display: flex;

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }

  .${Classes.TEXT} {
    padding-top: ${(props) => props.theme.spaces[1] - 2}px;
  }
`;

const Changes = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

export enum Kind {
  AHEAD_COMMIT = "AHEAD_COMMIT",
  BEHIND_COMMIT = "BEHIND_COMMIT",
  DATA_SOURCE = "DATA_SOURCE",
  JS_OBJECT = "JS_OBJECT",
  PAGE = "PAGE",
  QUERY = "QUERY",
}

type GitStatusProps = {
  iconName: string;
  message: string;
  hasValue: boolean;
};

type GitStatusMap = {
  [key in Kind]: (status: GitStatusData) => GitStatusProps;
};

const STATUS_MAP: GitStatusMap = {
  [Kind.AHEAD_COMMIT]: (status: GitStatusData) => ({
    message: aheadCommitMessage(status),
    iconName: "git-commit",
    hasValue: (status?.aheadCount || 0) > 0,
  }),
  [Kind.BEHIND_COMMIT]: (status: GitStatusData) => ({
    message: behindCommitMessage(status),
    iconName: "git-commit",
    hasValue: (status?.behindCount || 0) > 0,
  }),
  [Kind.DATA_SOURCE]: (status: GitStatusData) => ({
    message: `${status?.modifiedDatasources || 0} ${
      status?.modifiedDatasources || 0 ? "datasource" : "datasources"
    } modified`,
    iconName: "database-2-line",
    hasValue: (status?.modifiedDatasources || 0) > 0,
  }),
  [Kind.JS_OBJECT]: (status: GitStatusData) => ({
    message: `${status?.modifiedJSObjects || 0} JS ${
      (status?.modifiedJSObjects || 0) <= 1 ? "Object" : "Objects"
    } modified`,
    iconName: "js",
    hasValue: (status?.modifiedJSObjects || 0) > 0,
  }),
  [Kind.PAGE]: (status: GitStatusData) => ({
    message: `${status?.modifiedPages || 0} ${
      (status?.modifiedPages || 0) <= 1 ? "page" : "pages"
    } modified`,
    iconName: "widget",
    hasValue: (status?.modifiedPages || 0) > 0,
  }),
  [Kind.QUERY]: (status: GitStatusData) => ({
    message: `${status?.modifiedQueries || 0} ${
      (status?.modifiedQueries || 0) <= 1 ? "query" : "queries"
    } modified`,
    iconName: "query",
    hasValue: (status?.modifiedQueries || 0) > 0,
  }),
};

function behindCommitMessage(status: GitStatusData) {
  const behindCount = status?.behindCount || 0;
  let behindMessage =
    (behindCount || 0) === 1
      ? `${behindCount || 0} commit`
      : `${behindCount || 0} commits`;
  behindMessage += ` behind. ${createMessage(TRY_TO_PULL)}`;
  return behindMessage;
}

function aheadCommitMessage(status: GitStatusData) {
  const aheadCount = status?.aheadCount || 0;
  let aheadMessage =
    (aheadCount || 0) === 1
      ? `${aheadCount || 0} commit`
      : `${aheadCount || 0} commits`;
  aheadMessage += ` ahead. ${createMessage(NOT_PUSHED_YET)}`;
  return aheadMessage;
}

export function Change(props: Partial<GitStatusProps>) {
  const { iconName, message } = props;

  return (
    <Wrapper>
      <Icon name={iconName} size={IconSize.XXL} />
      <Text type={TextType.P3}>{message}</Text>
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
  modifiedQueries: 0,
  remoteBranch: "",
};

/**
 * gitChangeListData: accepts a git status
 * @param status {GitStatusData} status object that contains git-status call result from backend
 * @returns {JSX.Element[]}
 */
export function gitChangeListData(
  status: GitStatusData = defaultStatus,
): JSX.Element[] {
  const changeKind = [
    Kind.PAGE,
    Kind.QUERY,
    Kind.JS_OBJECT,
    Kind.DATA_SOURCE,
    Kind.AHEAD_COMMIT,
    Kind.BEHIND_COMMIT,
  ];
  return changeKind
    .map((type: Kind) => STATUS_MAP[type](status))
    .filter((s: GitStatusProps) => s.hasValue)
    .map((s) => <Change {...s} key={`change-status-${s.iconName}`} />)
    .filter((s) => !!s);
}

export default function GitChangesList({
  isAutoUpdate,
}: {
  isAutoUpdate: boolean;
}) {
  const status: GitStatusData = useSelector(getGitStatus) as GitStatusData;
  const loading = useSelector(getIsFetchingGitStatus);
  const changes = gitChangeListData(status);
  if (isAutoUpdate) {
    changes.push(
      <Change
        hasValue={isAutoUpdate}
        iconName="info"
        key="change-status-auto-update"
        message={createMessage(CHANGES_FROM_APPSMITH)}
      />,
    );
  }
  return loading ? (
    <DummyChange data-testid={"t--git-change-loading-dummy"} />
  ) : (
    <Changes data-testid={"t--git-change-statuses"}>{changes}</Changes>
  );
}
