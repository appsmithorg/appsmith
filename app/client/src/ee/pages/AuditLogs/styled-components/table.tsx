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
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StyledUserColumnContainer = styled.div`
  width: 25%;
  min-width: 250px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  & .event-user:hover {
    border-bottom: 1px dotted rgba(0, 0, 0, 0.7);
  }
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
