import styled from "styled-components";

export const StyledAuditLogsRightPaneContainer = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow-y: scroll;
`;

export const StyledAuditLogsContainer = styled.div`
  max-width: 1132px;
  margin: auto;
`;

export const StyledAuditLogsTableContainer = styled.div`
  margin-top: 16px;
`;

export const StyledCentreAlignedContainer = styled.div`
  margin: 32px auto;
  padding: 20px;
  text-align: center;
`;

export const StyledNoAuditLogsContainer = styled.div`
  height: 660px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  & .no-result-found-image {
    width: 194px;
    height: 155px;
    margin-bottom: 16px;
  }
`;

export const StyledFiltersContainer = styled.div`
  display: flex;
  gap: 16px;
  position: sticky;
  top: -40px;
  background-color: white;
  padding: 8px 0;
  margin: auto;
  /* This makes collapsible code fly below it; refer: AuditLogTable Head */
  z-index: 100;
`;

export const StyledCollapsibleLogContainer = styled.div`
  margin-left: 16px;
  padding-bottom: 8px;
  z-index: -1;
  box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.05);
`;

export const StyledCollapseContainer = styled.div`
  margin-left: 16px;
`;

export const StyledHeaderRightContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const StyledAuditLogsTableRowContainer = styled.div<{ isOpen: boolean }>`
  display: flex;
  gap: 5px;
  margin: 0 16px;
  height: 40px;
  align-items: center;
  /* Show shadow it if this is not open */
  box-shadow: ${(props) =>
    !props.isOpen ? "0 1px 0 0 rgba(0, 0, 0, 0.05)" : null};
`;

export const StyledFilterContainer = styled.div`
  & .audit-logs-filter-dropdown:hover {
    background-color: var(--appsmith-color-black-50);
  }

  & .cs-text {
    width: 100%;
  }

  & .custom-render-option {
    overflow: hidden;
  }
`;
