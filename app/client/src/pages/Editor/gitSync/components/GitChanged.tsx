import React from "react";
import styled from "constants/DefaultTheme";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import { GitStatusData } from "../../../../reducers/uiReducers/gitSyncReducer";

const Skeleton = styled.div`
  width: 50%;
  height: ${(props) => props.theme.spaces[9]}px;
  background: linear-gradient(
    90deg,
    ${Colors.GREY_2} 0%,
    rgba(240, 240, 240, 0) 100%
  );
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

const Statuses = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

export enum Kind {
  WIDGET = "WIDGET",
  QUERY = "QUERY",
  COMMIT = "COMMIT",
  // pullRequest = "pullRequest",
  JS_OBJECT = "JS_OBJECT",
}

type GitSyncProps = {
  type: Kind;
};

const STATUS_MAP = {
  [Kind.WIDGET]: (status: any) => ({
    message: `${status?.modifiedPages || 0} ${
      (status?.modifiedPages || 0) <= 1 ? "page" : "pages"
    } updated`,
    iconName: "widget",
  }),
  [Kind.QUERY]: (status: any) => ({
    message: `${status?.modifiedQueries || 0} ${
      (status?.modifiedQueries || 0) <= 1 ? "query" : "queries"
    } modified`,
    iconName: "query",
  }),
  [Kind.COMMIT]: (status: GitStatusData) => ({
    message: commitMessage(status),
    iconName: "git-commit",
  }),
  [Kind.JS_OBJECT]: (status: GitStatusData) => ({
    message: `${status.modifiedJSObjects || 0} JS ${
      (status.modifiedJSObjects || 0) <= 1 ? "Object" : "Objects"
    } modified`,
    iconName: "js",
  }),
};

function commitMessage(status: GitStatusData) {
  const { aheadCount, behindCount } = status;
  const aheadMessage =
    aheadCount > 0
      ? (aheadCount || 0) === 1
        ? `${aheadCount || 0} commit ahead`
        : `${aheadCount || 0} commits ahead`
      : null;
  const behindMessage =
    behindCount > 0
      ? (behindCount || 0) === 1
        ? `${behindCount || 0} commit behind`
        : `${behindCount || 0} commits behind `
      : null;
  return [aheadMessage, behindMessage].filter((i) => i !== null).join(" and ");
}

function Status(props: GitSyncProps) {
  const { type } = props;
  const status: GitStatusData = useSelector(getGitStatus) as GitStatusData;
  const loading = useSelector(getIsFetchingGitStatus);
  const { iconName, message } = STATUS_MAP[type](status);

  return loading ? (
    <Skeleton />
  ) : (
    <Wrapper>
      <Icon fillColor={Colors.GREY_10} name={iconName} size={IconSize.XXL} />
      <Text type={TextType.P3}>{message}</Text>
    </Wrapper>
  );
}

function WidgetStatus() {
  return <Status type={Kind.WIDGET} />;
}

function QueryStatus() {
  return <Status type={Kind.QUERY} />;
}

function CommitStatus() {
  return <Status type={Kind.COMMIT} />;
}

function JSObjectStatus() {
  return <Status type={Kind.JS_OBJECT} />;
}

export default function GitChanged() {
  return (
    <Statuses>
      <WidgetStatus />
      <QueryStatus />
      <CommitStatus />
      <JSObjectStatus />
    </Statuses>
  );
}
