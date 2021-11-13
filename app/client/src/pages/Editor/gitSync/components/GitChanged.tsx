import React from "react";
import styled from "constants/DefaultTheme";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  // getIsFetchingGitStatus,
  // getPullMergeStatus,
} from "selectors/gitSyncSelectors";

const Wrapper = styled.div`
  width: 178px;
  display: flex;
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }
`;

export enum Kind {
  widget = "widget",
  query = "query",
  commit = "commit",
  pullRequest = "pullRequest",
}

type GitSyncProps = {
  type: Kind;
};

export default function GitChanged(props: GitSyncProps) {
  const { type } = props;
  const gitStatus: any = useSelector(getGitStatus);
  // const pullMergeStatus: any = useSelector(getPullMergeStatus);
  let message = "",
    iconName: IconName;
  switch (type) {
    case Kind.widget:
      message = `${gitStatus.modifiedPages || 0} widget${
        gitStatus?.modifiedPages > 1 ? "s" : ""
      } updated`;
      iconName = "widget";
      break;
    case Kind.query:
      message = `${gitStatus.modifiedQueries || 0} ${
        (gitStatus.modifiedQueries || 0) > 1 ? "queries" : "query"
      } modified`;
      iconName = "query";
      break;
    case Kind.commit:
      message = `${gitStatus.aheadCount || 0} commit${
        (gitStatus.aheadCount || 0) > 1 ? "s" : ""
      } to push`;
      iconName = "git-commit";
      break;
    case Kind.pullRequest:
      message = `${gitStatus.behindCount || 0} pull request${
        (gitStatus.behindCount || 0) > 1 ? "s" : ""
      } pending`;
      iconName = "git-pull-request";
      break;
  }
  return (
    <Wrapper>
      <Icon fillColor={Colors.GREY_10} name={iconName} size={IconSize.XXL} />
      <Text type={TextType.P3}>{message}</Text>
    </Wrapper>
  );
}
