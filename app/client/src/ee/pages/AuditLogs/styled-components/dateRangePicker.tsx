import { DateRangePicker } from "design-system";
import styled from "styled-components";
import { AUDIT_LOGS_FILTER_WIDTH } from "../config/audit-logs-config";

export const StyledDateRangePicker = styled(DateRangePicker)`
  input {
    width: ${AUDIT_LOGS_FILTER_WIDTH};
  }
`;
