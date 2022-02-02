import React, { useEffect } from "react";
import styled from "constants/DefaultTheme";
import { Classes } from "components/ads/common";
import Text, { Case, FontWeight, TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";
import {
  createMessage,
  READ_DOCUMENTATION,
} from "@appsmith/constants/messages";
import { useSelector } from "store";
import {
  getConnectingErrorDocUrl,
  getGitConnectError,
} from "selectors/gitSyncSelectors";

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

export default function GitConnectError({
  onDisplay,
}: {
  onDisplay?: () => void;
}) {
  const error = useSelector(getGitConnectError);
  const connectingErrorDocumentUrl = useSelector(getConnectingErrorDocUrl);
  const titleMessage = error?.errorType
    ? error.errorType.replaceAll("_", " ")
    : "";
  useEffect(() => {
    if (error && onDisplay) {
      onDisplay();
    }
  }, [error]);
  return error ? (
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
      <LintText href={connectingErrorDocumentUrl} target="_blank">
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
