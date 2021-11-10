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
}

type GitSyncProps = {
  type: Kind;
};

export default function GitChanged(props: GitSyncProps) {
  const gitStatus = useSelector(getGitStatus);
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const text =
    props.type === Kind.widget ? " widgets updated" : " queries modified";
  const iconName = props.type === Kind.widget ? "widget" : "query";
  let changedNumber = 0;
  if (!isFetchingGitStatus && gitStatus?.isClean === false) {
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
    changedNumber = modified?.length || 0;
  }
  return (
    <Wrapper>
      <Icon fillColor={Colors.GREY_10} name={iconName} size={IconSize.XXL} />
      <Text type={TextType.P3}>
        {changedNumber} {text}
      </Text>
    </Wrapper>
  );
}
