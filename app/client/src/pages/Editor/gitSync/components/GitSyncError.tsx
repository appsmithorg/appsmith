import React, { useEffect } from "react";
import styled from "constants/DefaultTheme";
import { Classes } from "components/ads/common";
import Text, { Case, FontWeight, TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { createMessage, READ_DOCUMENTATION } from "constants/messages";
import { useSelector } from "store";
import { getGitConnectError } from "selectors/gitSyncSelectors";

const ErrorWrapper = styled.div`
  padding: 24px 0px;
  .${Classes.TEXT} {
    display: block;
    margin-bottom: ${(props) => props.theme.spaces[3]}px;
    &.t--read-document {
      display: inline-flex;
      .${Classes.ICON} {
        margin-left: ${(props) => props.theme.spaces[3]}px;
      }
    }
  }
`;

const LintText = styled.a`
  :hover {
    text-decoration: none;
    color: ${Colors.CRUSTA};
  }
  color: ${Colors.CRUSTA};
  cursor: pointer;
`;

export default function GitSyncError({
  onDisplay,
}: {
  onDisplay?: () => void;
}) {
  const error = useSelector(getGitConnectError);
  const titleMessage = error?.errorType
    ? error.errorType.replaceAll("_", " ")
    : "";
  let errorVisible = false;
  if (error) {
    errorVisible = true;
    if (error.code === 5006) {
      errorVisible = error.message.indexOf("git  push failed") < 0;
    }
  }
  useEffect(() => {
    if (errorVisible && onDisplay) {
      onDisplay();
    }
  }, []);
  return errorVisible ? (
    <ErrorWrapper>
      {titleMessage.length > 0 && (
        <Text
          case={Case.UPPERCASE}
          color={Colors.ERROR_RED}
          type={TextType.P1}
          weight={FontWeight.BOLD}
        >
          {titleMessage}
        </Text>
      )}
      <Text color={Colors.ERROR_RED} type={TextType.P2}>
        {error?.message}
      </Text>
      <LintText href={DOCS_BASE_URL} target="_blank">
        <Text
          case={Case.UPPERCASE}
          className="t--read-document"
          color={Colors.CHARCOAL}
          type={TextType.P3}
          weight={FontWeight.BOLD}
        >
          {createMessage(READ_DOCUMENTATION)}
          <Icon name="right-arrow" size={IconSize.SMALL} />
        </Text>
      </LintText>
    </ErrorWrapper>
  ) : null;
}
