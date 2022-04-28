import React from "react";
import styled from "styled-components";

import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import {
  createMessage,
  WIDGET_DEPRECATION_WARNING,
} from "@appsmith/constants/messages";

const MessageContainer = styled.div`
  display: flex;
  padding: 8px;
  margin-bottom: 8px;
  flex-direction: row;
  color: ${Colors.BROWN};
  background: ${Colors.WARNING_ORANGE};
  }
`;
const WarningIcon = styled(Icon)`
  padding: 10px;
  cursor: default;

  svg {
    cursor: default;
  }
`;
const MessageText = styled.p`
  padding-left: 4px;
  font-size: 13px;
  line-height: 16px;
  font-weight: 400;
`;

export function DeprecationMessage() {
  return (
    <MessageContainer className="t--deprecation-warning">
      <WarningIcon
        fillColor={Colors.WARNING_SOLID}
        name="warning-line"
        size={IconSize.XXXXL}
      />
      <MessageText>{createMessage(WIDGET_DEPRECATION_WARNING)}</MessageText>
    </MessageContainer>
  );
}
