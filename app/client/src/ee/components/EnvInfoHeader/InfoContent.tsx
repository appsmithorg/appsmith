import React from "react";
import { Text, Tooltip } from "design-system";
import styled from "styled-components";
import {
  createMessage,
  ENV_INFO_CALLOUT_CONTENT_1,
  ENV_INFO_CALLOUT_CONTENT_2,
  ENV_INFO_CALLOUT_CONTENT_3,
  ENV_INFO_CALLOUT_TOOLTIP,
} from "@appsmith/constants/messages";

const TextWithToolTip = styled(Text)`
  text-decoration: underline;
`;

const InfoContentContainer = styled.div`
  cursor: default;
`;

function InfoContent() {
  return (
    <InfoContentContainer>
      <Text kind="body-m">{createMessage(ENV_INFO_CALLOUT_CONTENT_1)}</Text>
      <Tooltip content={createMessage(ENV_INFO_CALLOUT_TOOLTIP)}>
        <TextWithToolTip kind="action-m">
          {createMessage(ENV_INFO_CALLOUT_CONTENT_2)}
        </TextWithToolTip>
      </Tooltip>
      <Text kind="body-m">{createMessage(ENV_INFO_CALLOUT_CONTENT_3)}</Text>
    </InfoContentContainer>
  );
}

export default InfoContent;
