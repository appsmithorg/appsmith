import { Text } from "design-system";
import styled from "styled-components";

export const StyledAuditLogsHeader = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const StyledAuditLogsHeading = styled(Text)`
  flex-grow: 0;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;
