export * from "ce/pages/common/ConvertEntityNotification";

import { Callout, Icon, Text } from "design-system";
import React from "react";
import styled from "styled-components";

interface ConvertEntityNotificationProps {
  name: string;
  withPadding?: boolean;
}

const StyledCallout = styled(Callout)<{ withPadding: boolean }>`
  margin: 0
    ${({ withPadding }) => (withPadding ? "var(--ads-v2-spaces-7)" : "0")};
`;

const StyledText = styled(Text)`
  display: flex;
  gap: 4px;
`;

function ConvertEntityNotification({
  name,
  withPadding = false,
}: ConvertEntityNotificationProps) {
  return (
    <StyledCallout kind="info" withPadding={withPadding}>
      <StyledText>
        We are replacing this with a module <Icon name="module" /> {name}. This
        process may take a few seconds.
      </StyledText>
    </StyledCallout>
  );
}

export default ConvertEntityNotification;
