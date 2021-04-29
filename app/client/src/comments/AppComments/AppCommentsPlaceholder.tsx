import React from "react";
import styled from "styled-components";
import {
  NO_COMMENTS_CLICK_ON_CANVAS_TO_ADD,
  createMessage,
} from "constants/messages";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  white-space: pre-line;
  & .message {
    text-align: center;
  }
`;

function AppCommentsPlaceholder() {
  return (
    <Container>
      <Icon fillColor={Colors.BLACK} name="chat" size={IconSize.XXL} />
      <span className="message">
        {createMessage(NO_COMMENTS_CLICK_ON_CANVAS_TO_ADD)}
      </span>
    </Container>
  );
}

export default AppCommentsPlaceholder;
