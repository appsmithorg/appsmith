import React from "react";
import { Dropdown, DropdownOption } from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAuditLogsData,
  selectAuditLogsSearchFilters,
} from "@appsmith/selectors/auditLogsSelectors";
import {
  fetchAuditLogsLogsInit,
  replaceAuditLogsEmails,
  setEmailJsonFilter,
} from "@appsmith/actions/auditLogsAction";
import {
  AUDIT_LOGS_FILTER_HEIGHT,
  AUDIT_LOGS_FILTER_WIDTH,
} from "../../config/audit-logs-config";
import { toUserEmail } from "@appsmith/pages/AuditLogs/utils/toDropdownOption";
import { LabelRenderer } from "./LabelRenderer";
import { StyledFilterContainer as Container } from "@appsmith/pages/AuditLogs/styled-components/container";
import { useGoToTop } from "@appsmith/pages/AuditLogs/hooks/useGoToTop";
import { StyledLabel as Label } from "@appsmith/pages/AuditLogs/styled-components/label";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { createMessage } from "design-system-old/build/constants/messages";
import { USERS_LABEL, USERS_PLACEHOLDER } from "@appsmith/constants/messages";

/**
 * EmailFilter generates a label, dropdown component that is connected to redux store.
 * It is dependent upon store.ui.auditLogs and related types and data.
 * @constructor
 * @returns {JSX.Element}
 */
export default function EmailFilter(): JSX.Element {
  const data = useSelector(selectAuditLogsData);
  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const { emails } = data;
  const selectedEmails = searchFilters?.selectedEmails;
  const dispatch = useDispatch();

  const { goToTop } = useGoToTop();

  /**
   * handleSelection takes the current selected value from the Dropdown (v1, design-system),
   * and updates redux store with {DropdownOption} value appropriately.
   * Then it fires a network call to fetch logs based selected values.
   * @param value {string}
   * @param dropdownOption {DropdownOption}
   */
  function handleSelection(value?: string, dropdownOption?: DropdownOption) {
    /**
     * @param {boolean} adding true if an unchecked option is selected/clicked-on.
     */
    const adding = !selectedEmails.find((email) => email.value === value);
    if (adding) {
      const email = dropdownOption || toUserEmail(value || "");
      dispatch(
        setEmailJsonFilter({
          email,
        }),
      );
      searchFilters.selectedEmails.push(email);
    } else {
      /* removing: when an already checked value is selected. */
      const index = selectedEmails.findIndex((email) => email.value === value);
      const newSelected = [
        ...selectedEmails.slice(0, index),
        ...selectedEmails.slice(index + 1),
      ];
      dispatch(replaceAuditLogsEmails({ emails: newSelected || [] }));
      searchFilters.selectedEmails = newSelected;
    }
    /* now fetch the logs */
    dispatch(fetchAuditLogsLogsInit(searchFilters));
    goToTop();

    AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_EMAIL", {
      count: searchFilters.selectedEmails.length,
    });
  }

  function removeSelectedOption(value: string, option: DropdownOption) {
    handleSelection(value, option);
  }

  return (
    <Container data-testid="t--audit-logs-email-filter-container">
      <Label>{createMessage(USERS_LABEL)}</Label>
      <Dropdown
        boundary="viewport"
        className="audit-logs-filter audit-logs-filter-dropdown audit-logs-email-filter-dropdown"
        data-testid="t--audit-logs-email-filter"
        defaultIcon="downArrow"
        dropdownMaxHeight={"500px"}
        enableSearch
        height={AUDIT_LOGS_FILTER_HEIGHT}
        isMultiSelect
        labelRenderer={LabelRenderer}
        onSelect={handleSelection}
        optionWidth={AUDIT_LOGS_FILTER_WIDTH}
        options={emails}
        placeholder={createMessage(USERS_PLACEHOLDER)}
        removeSelectedOption={removeSelectedOption}
        searchAutoFocus
        selected={selectedEmails}
        showEmptyOptions
        showLabelOnly
        width={AUDIT_LOGS_FILTER_WIDTH}
      />
    </Container>
  );
}
