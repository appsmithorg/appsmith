import React from "react";
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
import { toEvent } from "../../utils/toDropdownOption";
import { useGoToTop } from "../../hooks/useGoToTop";
import {
  OptionLabel,
  StyledFilterContainer as Container,
  StyledCheckbox as Checkbox,
} from "../../styled-components/container";
import { StyledLabel as Label } from "../../styled-components/label";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  EVENTS_LABEL,
  EVENTS_PLACEHOLDER,
} from "@appsmith/constants/messages";
import { Option, Select } from "design-system";
import type { DefaultOptionType } from "rc-select/lib/Select";

export default function EventFilter() {
  const data = useSelector(selectAuditLogsData);
  const { events } = data;
  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const selectedEvents = searchFilters?.selectedEvents;
  const dispatch = useDispatch();

  const { goToTop } = useGoToTop();

  function handleSelection(value?: string, dropdownOption?: DefaultOptionType) {
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

  function removeSelectedOption(value: string, option: DefaultOptionType) {
    handleSelection(value, option);
  }

  return (
    <Container data-testid="t--audit-logs-event-type-filter-container">
      <Label renderAs="label">{createMessage(EVENTS_LABEL)}</Label>
      <Select
        className="audit-logs-filter audit-logs-filter-dropdown audit-logs-event-filter-dropdown"
        data-testid="t--audit-logs-event-type-filter"
        isMultiSelect
        maxTagTextLength={selectedEvents.length === 1 ? 20 : 5}
        onDeselect={removeSelectedOption}
        onSelect={handleSelection}
        optionLabelProp="label"
        placeholder={createMessage(EVENTS_PLACEHOLDER)}
        showSearch
        size="md"
        value={selectedEvents}
        virtual={false}
      >
        {events.length > 0 &&
          events.map((obj) => (
            <Option key={obj.key} label={obj.label} value={obj.value}>
              <div className="flex gap-1 items-center">
                <Checkbox
                  isSelected={Boolean(
                    selectedEvents.find((v) => v.value == obj.value),
                  )}
                />
                <OptionLabel>{obj.label}</OptionLabel>
              </div>
            </Option>
          ))}
      </Select>
    </Container>
  );
}
