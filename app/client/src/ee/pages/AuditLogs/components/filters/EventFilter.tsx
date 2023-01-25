import React from "react";
import { Dropdown, DropdownOption } from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAuditLogsData,
  selectAuditLogsSearchFilters,
} from "@appsmith/selectors/auditLogsSelectors";
import {
  fetchAuditLogsLogsInit,
  replaceAuditLogsEvents,
  setEventJsonFilter,
} from "@appsmith/actions/auditLogsAction";
import {
  AUDIT_LOGS_FILTER_HEIGHT,
  AUDIT_LOGS_FILTER_WIDTH,
} from "../../config/audit-logs-config";
import { LabelRenderer } from "./LabelRenderer";
import { toEvent } from "../../utils/toDropdownOption";
import { useGoToTop } from "../../hooks/useGoToTop";
import { StyledFilterContainer as Container } from "../../styled-components/container";
import { StyledLabel as Label } from "../../styled-components/label";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { createMessage } from "design-system-old/build/constants/messages";
import { EVENTS_LABEL, EVENTS_PLACEHOLDER } from "@appsmith/constants/messages";

export default function EventFilter() {
  const data = useSelector(selectAuditLogsData);
  const { events } = data;
  const selectedEvents = data?.searchFilters?.selectedEvents;
  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const dispatch = useDispatch();

  const { goToTop } = useGoToTop();

  function handleSelection(value?: string, dropdownOption?: DropdownOption) {
    const adding = !selectedEvents.find((event) => event.value === value);
    if (adding) {
      const event = dropdownOption || toEvent(value || "");
      dispatch(
        setEventJsonFilter({
          event,
        }),
      );
      searchFilters.selectedEvents.push(event);
    } else {
      /* removing */
      const index = selectedEvents.findIndex((event) => event.value === value);
      const newSelected = [
        ...selectedEvents.slice(0, index),
        ...selectedEvents.slice(index + 1),
      ];
      dispatch(replaceAuditLogsEvents({ events: newSelected || [] }));
      searchFilters.selectedEvents = newSelected;
    }
    /* now fetch the logs */
    dispatch(fetchAuditLogsLogsInit(searchFilters));
    /* goToTop(); triggers scroll to the top;
       We need to go to the top because logs are loaded at current scroll position.
       By taking user to the top, we ensure that user sees all of the logs.
    */
    goToTop();

    AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_EVENT", {
      count: searchFilters.selectedEvents.length,
    });
  }

  function removeSelectedOption(value: string, option: DropdownOption) {
    handleSelection(value, option);
  }

  return (
    <Container data-testid="t--audit-logs-event-type-filter-container">
      <Label>{createMessage(EVENTS_LABEL)}</Label>
      <Dropdown
        boundary="viewport"
        className="audit-logs-filter audit-logs-filter-dropdown audit-logs-event-filter-dropdown"
        data-testid="t--audit-logs-event-type-filter"
        defaultIcon="downArrow"
        dropdownMaxHeight={"500px"}
        enableSearch
        height={AUDIT_LOGS_FILTER_HEIGHT}
        isMultiSelect
        labelRenderer={LabelRenderer}
        onSelect={handleSelection}
        optionWidth={AUDIT_LOGS_FILTER_WIDTH}
        options={events}
        placeholder={createMessage(EVENTS_PLACEHOLDER)}
        removeSelectedOption={removeSelectedOption}
        searchAutoFocus
        selected={selectedEvents}
        showEmptyOptions
        showLabelOnly
        width={AUDIT_LOGS_FILTER_WIDTH}
      />
    </Container>
  );
}
