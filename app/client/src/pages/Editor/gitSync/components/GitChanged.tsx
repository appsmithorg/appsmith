import React, { useRef } from "react";
import styled from "constants/DefaultTheme";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import { GitChangedKey } from "../constants";

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
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const changedNumber = useRef(0);
  if (!isFetchingGitStatus) {
    if (
      (type === Kind.widget || type === Kind.query) &&
      gitStatus?.isClean === false
    ) {
      const modified = gitStatus?.modified.filter((path: string) => {
        if (props.type === Kind.widget) {
          return (
            path.indexOf(GitChangedKey.PAGE) > -1 ||
            path.indexOf(GitChangedKey.APPLICATION) > -1
          );
        } else {
          return (
            path.indexOf(GitChangedKey.DATASOURCE) > -1 ||
            path.indexOf(GitChangedKey.ACTION) > -1
          );
        }
      });
      changedNumber.current = modified?.length || 0;
    } else if (type === Kind.commit) {
      changedNumber.current = gitStatus?.aheadCount || 0;
    } else if (type === Kind.pullRequest) {
      changedNumber.current = gitStatus?.behindCount || 0;
    }
  }

  let message = "",
    iconName: IconName;
  switch (props.type) {
    case Kind.widget:
      message = `${changedNumber.current} widget${
        changedNumber.current > 1 ? "s" : ""
      } updated`;
      iconName = "widget";
      break;
    case Kind.query:
      message = `${changedNumber.current} ${
        changedNumber.current > 1 ? "queries" : "query"
      } modified`;
      iconName = "query";
      break;
    case Kind.commit:
      message = `${changedNumber.current} commit${
        changedNumber.current > 1 ? "s" : ""
      } to push`;
      iconName = "git-commit";
      break;
    case Kind.pullRequest:
      message = `${changedNumber.current} pull request${
        changedNumber.current > 1 ? "s" : ""
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
