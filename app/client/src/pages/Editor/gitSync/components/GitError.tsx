import React from "react";
import styled from "constants/DefaultTheme";
import { Classes } from "components/ads/common";
import Text, { Case, FontWeight, TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import Icon, { IconSize } from "components/ads/Icon";
import {
  ReduxActionErrorType,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import {
  createMessage,
  ERROR_CONNECTING,
  READ_DOCUMENTATION,
} from "constants/messages";

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

type ErrorProps = {
  error: string | null;
  type: ReduxActionErrorType;
};

export default function GitSyncError(props: ErrorProps) {
  let titleMessage = "";
  switch (props.type) {
    case ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR:
      titleMessage = createMessage(ERROR_CONNECTING);
      break;
  }

  return props.error?.length ? (
    <ErrorWrapper>
      <Text
        case={Case.UPPERCASE}
        color={Colors.ERROR_RED}
        type={TextType.P1}
        weight={FontWeight.BOLD}
      >
        {titleMessage}
      </Text>
      <Text color={Colors.ERROR_RED} type={TextType.P2}>
        {props.error}
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
