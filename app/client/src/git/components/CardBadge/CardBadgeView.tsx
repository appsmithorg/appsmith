import React from "react";
import styled from "styled-components";
import { Icon, Tooltip } from "@appsmith/ads";

import { CONNECTED_TO_GIT, createMessage } from "ee/constants/messages";

const Container = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: -12px;
  right: -12px;
  box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.07);
  background: var(--ads-v2-color-bg);
`;

function CardBadgeView() {
  return (
    <Container>
      <Tooltip content={createMessage(CONNECTED_TO_GIT)}>
        <Icon name="fork" size="md" />
      </Tooltip>
    </Container>
  );
}

export default CardBadgeView;
