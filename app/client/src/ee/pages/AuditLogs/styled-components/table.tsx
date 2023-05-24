import { Text } from "design-system";
import styled from "styled-components";

export const StyledAuditLogsTableHead = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px;
  height: 40px;
  background-color: var(--ads-v2-color-bg-subtle);
  align-items: center;
  position: sticky;
  top: 41px;
  /** z-index: 100
   * This makes collapsible code fly below it; refer: filters container
   * Without z-index, the collapsible component shows above these components.
   * With z-index on collapsible component, the code becomes non-interactive.
  */
  z-index: 100;

  & div {
    cursor: default;
  }
`;

export const StyledEventDescriptionColumnContainer = styled.div`
  width: 55%;
  min-width: 550px;
  height: 40px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  color: var(--ads-v2-color-fg);
`;
export const StyledDescriptionRow = styled(
  StyledEventDescriptionColumnContainer,
)`
  align-items: flex-start;
`;
export const StyledDescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--ads-v2-color-fg);
`;
export const StyledMainDescription = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
  // TODO: just need to make the text bold, not increase font-size.
  .action-type {
    font-weight: 600;
  }
`;
export const StyledSubDescription = styled(Text)`
  color: var(--ads-v2-color-fg-muted);
`;

export const StyledUserColumnContainer = styled.div`
  width: 25%;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 20px;
  min-width: 250px;
  color: var(--ads-v2-color-fg);
  .event-user {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 200px;
    color: var(--ads-v2-color-fg-emphasis);

    &.name {
      color: var(--ads-v2-color-fg-emphasis-plus);
    }
  }
`;
export const StyledProfileData = styled.div`
  min-width: 200px;
`;

export const StyledDateColumnContainer = styled.div`
  width: 20%;
  min-width: 200px;
  display: flex;
  gap: 4px;

  & .column-header,
  .audit-logs-table-head & {
    cursor: pointer;
    color: var(--ads-v2-color-fg);
  }
`;
export const StyledDateInfoContainer = styled.div`
  width: 20%;
  min-width: 200px;
  color: var(--ads-v2-color-fg);

  .time {
    color: var(--ads-v2-color-fg-muted);
  }
`;
