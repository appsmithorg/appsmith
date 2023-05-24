import React from "react";
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
import { toUserEmail } from "@appsmith/pages/AuditLogs/utils/toDropdownOption";
import { StyledFilterContainer as Container } from "@appsmith/pages/AuditLogs/styled-components/container";
import { useGoToTop } from "@appsmith/pages/AuditLogs/hooks/useGoToTop";
import { StyledLabel as Label } from "@appsmith/pages/AuditLogs/styled-components/label";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  USERS_LABEL,
  USERS_PLACEHOLDER,
} from "@appsmith/constants/messages";
import { Select, Option } from "design-system";
import type { DefaultOptionType } from "rc-select/lib/Select";

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
  function handleSelection(value?: string, dropdownOption?: DefaultOptionType) {
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

  function removeSelectedOption(value: string, option: DefaultOptionType) {
    handleSelection(value, option);
  }

  return (
    <Container data-testid="t--audit-logs-email-filter-container">
      <Label renderAs="label">{createMessage(USERS_LABEL)}</Label>
      <Select
        className="audit-logs-filter audit-logs-filter-dropdown audit-logs-event-filter-dropdown"
        data-testid="t--audit-logs-event-type-filter"
        isMultiSelect
        maxTagTextLength={selectedEmails.length === 1 ? 20 : 5}
        onDeselect={removeSelectedOption}
        onSelect={handleSelection}
        placeholder={createMessage(USERS_PLACEHOLDER)}
        showSearch
        size="md"
        value={selectedEmails}
        virtual={false}
      >
        {emails.length > 0 &&
          emails.map((obj) => (
            <Option key={obj.key} value={obj.value}>
              {obj.label}
            </Option>
          ))}
      </Select>
    </Container>
  );
}
