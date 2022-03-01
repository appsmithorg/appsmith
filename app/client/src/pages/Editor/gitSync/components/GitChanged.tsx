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

const Skeleton = styled.div`
  width: 100%;
  height: ${(props) => props.theme.spaces[9]}px;
  background: linear-gradient(
    90deg,
    ${Colors.GREY_2} 0%,
    rgba(240, 240, 240, 0) 100%
  );
  margin-right: ${(props) => props.theme.spaces[8] + 5}px;
`;

const Wrapper = styled.div`
  //width: 178px;
  height: ${(props) => props.theme.spaces[9]}px;
  display: flex;

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }

  .${Classes.TEXT} {
    padding-top: ${(props) => props.theme.spaces[1] - 2}px;
  }
`;

const ChangeDifferences = styled.div`
  margin-bottom: 2px;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

export enum Kind {
  widget = "widget",
  query = "query",
  commit = "commit",
  // pullRequest = "pullRequest",
}

type GitSyncProps = {
  type: Kind;
};

const GIT_STATUS_MAP = {
  [Kind.widget]: (status: any) => ({
    message: `${status?.modifiedPages || 0} ${
      (status?.modifiedPages || 0) === 1 ? "page" : "pages"
    } updated`,
    iconName: "widget",
  }),
  [Kind.query]: (status: any) => ({
    message: `${status?.modifiedQueries || 0} ${
      (status?.modifiedQueries || 0) === 1 ? "query" : "queries"
    } modified`,
    iconName: "query",
  }),
  [Kind.commit]: (status: any) => ({
    message: `${status?.aheadCount || 0} ${
      (status?.aheadCount || 0) === 1 ? "commit" : "commits"
    } to push`,
    iconName: "git-commit",
  }),
};

function GitStatus(props: GitSyncProps) {
  const { type } = props;
  const status: any = useSelector(getGitStatus);
  const loading = useSelector(getIsFetchingGitStatus);
  // const loading = true;
  const { iconName, message } = GIT_STATUS_MAP[type](status);
  return loading ? (
    <Skeleton />
  ) : (
    <Wrapper>
      <Icon fillColor={Colors.GREY_10} name={iconName} size={IconSize.XXL} />
      <Text type={TextType.P3}>{message}</Text>
    </Wrapper>
  );
}

export default function GitChanged() {
  const gitStatus: any = useSelector(getGitStatus);
  return (
    <ChangeDifferences>
      <GitStatus type={Kind.widget} />
      <GitStatus type={Kind.query} />
      {gitStatus?.aheadCount > 0 && <GitStatus type={Kind.commit} />}
    </ChangeDifferences>
  );
}
