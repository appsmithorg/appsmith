import styled from "styled-components";
import { AUDIT_LOGS_FILTER_WIDTH } from "../config/audit-logs-config";

export const StyledAuditLogsRightPaneContainer = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding: var(--ads-v2-spaces-7);
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow-y: scroll;
`;

export const StyledAuditLogsContainer = styled.div`
  max-width: 1132px;
  margin: auto;
  min-width: 1000px;
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
  align-items: baseline;
  /* This makes collapsible code fly below it; refer: AuditLogTable Head */
  z-index: 101;
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
  min-height: 40px;
  padding: 8px 0;
  align-items: center;
  /* Show shadow it if this is not open */
  box-shadow: ${(props) =>
    !props.isOpen ? "0 1px 0 0 rgba(0, 0, 0, 0.05)" : null};
`;

export const StyledFilterContainer = styled.div`
  display: flex;
  flex-direction: column;

  & .custom-render-option {
    overflow: hidden;
  }

  & .react-datepicker-wrapper {
    display: flex;
  }

  & .audit-logs-filter {
    width: ${AUDIT_LOGS_FILTER_WIDTH};
  }
`;
