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
  RefreshButtonIcon: ".t--left-icon",
  FiltersContainer: "[data-testid='t--audit-logs-filters-container']",
  EventFilterContainer:
    "[data-testid='t--audit-logs-event-type-filter-container']",
  EmailFilterContainer: "[data-testid='t--audit-logs-email-filter-container']",
  ResourceIdFilterContainer:
    "[data-testid='t--audit-logs-resource-id-filter-container']",
  DateFilterContainer: "[data-testid='t--audit-logs-date-filter-container']",
  EventFilterDropdown:
    ".audit-logs-filter.audit-logs-filter-dropdown.audit-logs-event-filter-dropdown",
  EmailFilterDropdown:
    ".audit-logs-filter.audit-logs-filter-dropdown.audit-logs-email-filter-dropdown",
  ResourceIdFilterText: ".audit-logs-filter.audit-logs-resource-id-filter",
  OpenBlueprintPortal: ".bp3-overlay.bp3-overlay-open",
  EventFilterDropdownBlueprintPortal:
    ".bp3-popover.bp3-minimal.audit-logs-filter.audit-logs-filter-dropdown.audit-logs-event-filter-dropdown.none-shadow-popover",
  ClearButton: "[data-testid='t--audit-logs-filters-clear-all-button']",
  RowsContainer: "[data-testid='t--audit-logs-table-rows-container']",
  Renderer: "[data-testid='t--audit-logs-filter-label-renderer']",
  EndMarker: "[data-testid='t--audit-logs-table-end-marker']",
  Loading: "[data-testid='t--audit-logs-loading']",
  OptionsWrapper: "[data-testid='dropdown-options-wrapper']",
  ...Table,
};
