const TableHeader = {
  TableHeadContainer: "[data-testid='t--audit-logs-table-head']",
  TableHeadEventCol: "[data-testid='t--audit-logs-table-head-event-col']",
  TableHeadUserCol: "[data-testid='t--audit-logs-table-head-user-col']",
  TableHeadDateCol: "[data-testid='t--audit-logs-table-head-date-col']",
};

const Table = {
  TableContainer: "[data-testid='t--audit-logs-table']",
  ...TableHeader,
};

export default {
  AdminSettingsEntryLink: ".admin-settings-menu-option",
  LeftPaneAuditLogsLink: ".t--settings-category-audit-logs",
  RightPaneAuditLogsContainer:
    "[data-testid='t--audit-logs-feature-container']",
  Heading: "[data-testid='t--audit-logs-header-heading']",
  RefreshButton: "[data-testid='t--audit-logs-header-refresh-button']",
  FiltersContainer: "[data-testid='t--audit-logs-filters-container']",
  EventFilterContainer:
    "[data-testid='t--audit-logs-event-type-filter-container']",
  EmailFilterContainer: "[data-testid='t--audit-logs-email-filter-container']",
  ResourceIdFilterContainer:
    "[data-testid='t--audit-logs-resource-id-filter-container']",
  DateFilterContainer: "[data-testid='t--audit-logs-date-filter-container']",
  EventFilterDropdown:
    ".audit-logs-filter.audit-logs-filter-dropdown.audit-logs-event-filter-dropdown",
  EmailFilterDropdown: "[data-testid='t--audit-logs-event-type-filter']",
  ResourceIdFilterText: ".audit-logs-filter.audit-logs-resource-id-filter",
  ClearButton: "[data-testid='t--audit-logs-filters-clear-all-button']",
  RowsContainer: "[data-testid='t--audit-logs-table-rows-container']",
  Renderer: ".rc-select-selection-overflow-item",
  EndMarker: "[data-testid='t--audit-logs-table-end-marker']",
  Loading: "[data-testid='t--audit-logs-loading']",
  OptionsWrapper: ".ads-v2-select__dropdown",
  OptionsInnerWrapper: ".rc-virtual-list-holder-inner",
  OptionsEmpty: ".rc-select-item-empty",
  SelectSearchBox: ".rc-select-selection-search-input",
  ...Table,
};
