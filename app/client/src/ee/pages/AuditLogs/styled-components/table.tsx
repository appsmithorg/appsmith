import styled from "styled-components";

export const StyledAuditLogsTableHead = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px;
  height: 40px;
  background-color: rgb(248, 248, 248);
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
  color: #393939;
`;
export const StyledDescriptionRow = styled(
  StyledEventDescriptionColumnContainer,
)`
  align-items: flex-start;
`;
export const StyledDescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledMainDescription = styled.div`
  span {
    font-weight: 600;
  }
`;
export const StyledSubDescription = styled.div`
  color: #939393;
`;

export const StyledUserColumnContainer = styled.div`
  width: 25%;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 20px;
  min-width: 250px;
  .event-user {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 200px;
    color: #575757;
    font-size: 13px;
    &.name {
      font-weight: 500;
      font-size: 14px;
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
  }
`;
export const StyledDateInfoContainer = styled.div`
  width: 20%;
  min-width: 200px;
  color: #393939;
  .time {
    color: #939393;
  }
`;
