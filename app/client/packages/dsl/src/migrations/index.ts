import { flattenDSL } from "../DSL";
import { updateContainers } from "./001-update-containers";
import { chartDataMigration } from "./002-chart-data-migration";
import { mapDataMigration } from "./003-map-data-migration";
import { singleChartDataMigration } from "./004-single-chart-data-migration";
import { tabsWidgetTabsPropertyMigration } from "./005-tabs-widget-property-migration";
import { dynamicPathListMigration } from "./006-dynamic-path-list-migration";
import { canvasNameConflictMigration } from "./007-canvas-name-conflict-migration";
import { renamedCanvasNameConflictMigration } from "./008-renamed-canvas-name-conflict-migration";
import { tableWidgetPropertyPaneMigrations } from "./009-table-widget-property-pane-migration";
import { addVersionNumberMigration } from "./010-add-version-number-migration";
import { migrateTablePrimaryColumnsBindings } from "./011-migrate-table-primary-columns-binding";
import { migrateIncorrectDynamicBindingPathLists } from "./012-migrate-incorrect-dynamic-binding-path-lists";
import { migrateOldChartData } from "./013-migrate-old-chart-data";
import { rteDefaultValueMigration } from "./014-rte-default-value-migration";
import { migrateTextStyleFromTextWidget } from "./015-migrate-text-style-from-text-widget";
import { migrateChartDataFromArrayToObject } from "./016-migrate-chart-data-from-array-to-object";
import { migrateTabsData } from "./017-migrate-tabs-data";
import { migrateInitialValues } from "./018-migrate-initial-values";
import {
  getCanvasSnapRows,
  migrateToNewLayout,
} from "./019-migrate-to-new-layout";
import { migrateNewlyAddedTabsWidgetsMissingData } from "./020-migrate-newly-added-tabs-widgets-missing-data";
import {
  migrateOverFlowingTabsWidgets,
  migrateWidgetsWithoutLeftRightColumns,
} from "./021-migrate-overflowing-tabs-widgets";
import { migrateTableWidgetParentRowSpaceProperty } from "./022-migrate-table-widget-parent-row-space-property";
import { addLogBlackListToAllListWidgetChildren } from "./023-add-log-blacklist-to-all-widget-children";
import { migrateTableWidgetHeaderVisibilityProperties } from "./024-migrate-table-widget-header-visibility-properties";
import { migrateItemsToListDataInListWidget } from "./025-migrate-items-to-list-data-in-list-widget";
import { migrateDatePickerMinMaxDate } from "./026-migrate-datepicker-min-max-date";
import { migrateFilterValueForDropDownWidget } from "./027-migrate-filter-value-for-dropdown-widget";
import { migrateTablePrimaryColumnsComputedValue } from "./028-migrate-table-primary-columns-computed-value";
import { migrateToNewMultiSelect } from "./029-migrate-to-new-multiselect";
import { migrateTableWidgetDelimiterProperties } from "./030-migrate-table-widget-delimiter-properties";
import { migrateIsDisabledToButtonColumn } from "./031-migrate-is-disabled-to-button-column";
import { migrateTableDefaultSelectedRow } from "./032-migrate-table-default-selected-row";
import { migrateMenuButtonWidgetButtonProperties } from "./033-migrate-menu-button-widget-button-properties";
import { migrateButtonWidgetValidation } from "./034-migrate-button-widget-validation";
import { migrateInputValidation } from "./035-migrate-input-validation";
import { revertTableDefaultSelectedRow } from "./036-revert-table-default-selected-row";
import { migrateTableSanitizeColumnKeys } from "./037-migrate-table-sanitize-column-keys";
import { migrateResizableModalWidgetProperties } from "./038-migrate-resizable-modal-widget-properties";
import { migrateTableWidgetSelectedRowBindings } from "./039-migrate-table-widget-selected-row-bindings";
import { revertButtonStyleToButtonColor } from "./040-revert-button-style-to-button-color";
import { migrateButtonVariant } from "./041-migrate-button-variant";
import { migrateMapWidgetIsClickedMarkerCentered } from "./042-migrate-map-widget-is-clicked-marker-centered";
import { mapAllowHorizontalScrollMigration } from "./043-map-allow-horizontal-scroll-mirgation";
import { isSortableMigration } from "./044-is-sortable-migration";
import { migrateTableWidgetIconButtonVariant } from "./045-migrate-table-widget-icon-button-variant";
import { migrateCheckboxGroupWidgetInlineProperty } from "./046-migrate-checkbox-group-widget-inline-property";
import { migrateRecaptchaType } from "./048-migrate-recaptcha-type";
import { addPrivateWidgetsToAllListWidgets } from "./049-add-private-widgets-to-all-list-widgets";
import { migratePhoneInputWidgetAllowFormatting } from "./051-migrate-phone-input-widget-allow-formatting";
import type { DSLWidget } from "./types";

// A rudimentary transform function which updates the DSL based on its version.
// A more modular approach needs to be designed.
// This needs the widget config to be already built to migrate correctly
export const migrateDSL = (currentDSL: DSLWidget, newPage = false) => {
  if (currentDSL.version === 1) {
    if (currentDSL.children && currentDSL.children.length > 0)
      currentDSL.children = currentDSL.children.map(updateContainers);
    currentDSL.version = 2;
  }
  if (currentDSL.version === 2) {
    currentDSL = chartDataMigration(currentDSL);
    currentDSL.version = 3;
  }
  if (currentDSL.version === 3) {
    currentDSL = mapDataMigration(currentDSL);
    currentDSL.version = 4;
  }
  if (currentDSL.version === 4) {
    currentDSL = singleChartDataMigration(currentDSL);
    currentDSL.version = 5;
  }
  if (currentDSL.version === 5) {
    currentDSL = tabsWidgetTabsPropertyMigration(currentDSL);
    currentDSL.version = 6;
  }
  if (currentDSL.version === 6) {
    currentDSL = dynamicPathListMigration(currentDSL);
    currentDSL.version = 7;
  }

  if (currentDSL.version === 7) {
    currentDSL = canvasNameConflictMigration(currentDSL);
    currentDSL.version = 8;
  }

  if (currentDSL.version === 8) {
    currentDSL = renamedCanvasNameConflictMigration(currentDSL);
    currentDSL.version = 9;
  }

  if (currentDSL.version === 9) {
    currentDSL = tableWidgetPropertyPaneMigrations(currentDSL);
    currentDSL.version = 10;
  }

  if (currentDSL.version === 10) {
    currentDSL = addVersionNumberMigration(currentDSL);
    currentDSL.version = 11;
  }

  if (currentDSL.version === 11) {
    currentDSL = migrateTablePrimaryColumnsBindings(currentDSL);
    currentDSL.version = 12;
  }

  if (currentDSL.version === 12) {
    currentDSL = migrateIncorrectDynamicBindingPathLists(currentDSL);
    currentDSL.version = 13;
  }

  if (currentDSL.version === 13) {
    currentDSL = migrateOldChartData(currentDSL);
    currentDSL.version = 14;
  }

  if (currentDSL.version === 14) {
    currentDSL = rteDefaultValueMigration(currentDSL);
    currentDSL.version = 15;
  }

  if (currentDSL.version === 15) {
    currentDSL = migrateTextStyleFromTextWidget(currentDSL);
    currentDSL.version = 16;
  }

  if (currentDSL.version === 16) {
    currentDSL = migrateChartDataFromArrayToObject(currentDSL);
    currentDSL.version = 17;
  }

  if (currentDSL.version === 17) {
    currentDSL = migrateTabsData(currentDSL);
    currentDSL.version = 18;
  }

  if (currentDSL.version === 18) {
    currentDSL = migrateInitialValues(currentDSL);
    currentDSL.version = 19;
  }

  if (currentDSL.version === 19) {
    currentDSL.snapColumns = 64; // GridDefaults.DEFAULT_GRID_COLUMNS;
    currentDSL.snapRows = getCanvasSnapRows(currentDSL.bottomRow);
    if (!newPage) {
      currentDSL = migrateToNewLayout(currentDSL);
    }
    currentDSL.version = 20;
  }

  if (currentDSL.version === 20) {
    currentDSL = migrateNewlyAddedTabsWidgetsMissingData(currentDSL);
    currentDSL.version = 21;
  }

  if (currentDSL.version === 21) {
    const canvasWidgets = flattenDSL(currentDSL);
    currentDSL = migrateWidgetsWithoutLeftRightColumns(
      currentDSL,
      canvasWidgets,
    );
    currentDSL = migrateOverFlowingTabsWidgets(currentDSL, canvasWidgets);
    currentDSL.version = 22;
  }

  if (currentDSL.version === 22) {
    currentDSL = migrateTableWidgetParentRowSpaceProperty(currentDSL);
    currentDSL.version = 23;
  }

  if (currentDSL.version === 23) {
    currentDSL = addLogBlackListToAllListWidgetChildren(currentDSL);
    currentDSL.version = 24;
  }

  if (currentDSL.version === 24) {
    currentDSL = migrateTableWidgetHeaderVisibilityProperties(currentDSL);
    currentDSL.version = 25;
  }

  if (currentDSL.version === 25) {
    currentDSL = migrateItemsToListDataInListWidget(currentDSL);
    currentDSL.version = 26;
  }

  if (currentDSL.version === 26) {
    currentDSL = migrateDatePickerMinMaxDate(currentDSL);
    currentDSL.version = 27;
  }
  if (currentDSL.version === 27) {
    currentDSL = migrateFilterValueForDropDownWidget(currentDSL);
    currentDSL.version = 28;
  }

  if (currentDSL.version === 28) {
    currentDSL = migrateTablePrimaryColumnsComputedValue(currentDSL);
    currentDSL.version = 29;
  }

  if (currentDSL.version === 29) {
    currentDSL = migrateToNewMultiSelect(currentDSL);
    currentDSL.version = 30;
  }
  if (currentDSL.version === 30) {
    currentDSL = migrateTableWidgetDelimiterProperties(currentDSL);
    currentDSL.version = 31;
  }

  if (currentDSL.version === 31) {
    currentDSL = migrateIsDisabledToButtonColumn(currentDSL);
    currentDSL.version = 32;
  }

  if (currentDSL.version === 32) {
    currentDSL = migrateTableDefaultSelectedRow(currentDSL);
    currentDSL.version = 33;
  }

  if (currentDSL.version === 33) {
    currentDSL = migrateMenuButtonWidgetButtonProperties(currentDSL);
    currentDSL.version = 34;
  }

  if (currentDSL.version === 34) {
    currentDSL = migrateButtonWidgetValidation(currentDSL);
    currentDSL.version = 35;
  }

  if (currentDSL.version === 35) {
    currentDSL = migrateInputValidation(currentDSL);
    currentDSL.version = 36;
  }

  if (currentDSL.version === 36) {
    currentDSL = revertTableDefaultSelectedRow(currentDSL);
    currentDSL.version = 37;
  }

  if (currentDSL.version === 37) {
    currentDSL = migrateTableSanitizeColumnKeys(currentDSL);
    currentDSL.version = 38;
  }

  if (currentDSL.version === 38) {
    currentDSL = migrateResizableModalWidgetProperties(currentDSL);
    currentDSL.version = 39;
  }

  if (currentDSL.version === 39) {
    currentDSL = migrateTableWidgetSelectedRowBindings(currentDSL);
    currentDSL.version = 40;
  }

  if (currentDSL.version === 40) {
    currentDSL = revertButtonStyleToButtonColor(currentDSL);
    currentDSL.version = 41;
  }

  if (currentDSL.version === 41) {
    currentDSL = migrateButtonVariant(currentDSL);
    currentDSL.version = 42;
  }

  if (currentDSL.version === 42) {
    currentDSL = migrateMapWidgetIsClickedMarkerCentered(currentDSL);
    currentDSL.version = 43;
  }

  if (currentDSL.version === 43) {
    currentDSL = mapAllowHorizontalScrollMigration(currentDSL);
    currentDSL.version = 44;
  }
  if (currentDSL.version === 44) {
    currentDSL = isSortableMigration(currentDSL);
    currentDSL.version = 45;
  }

  if (currentDSL.version === 45) {
    currentDSL = migrateTableWidgetIconButtonVariant(currentDSL);
    currentDSL.version = 46;
  }

  if (currentDSL.version === 46) {
    currentDSL = migrateCheckboxGroupWidgetInlineProperty(currentDSL);
    currentDSL.version = 47;
  }

  if (currentDSL.version === 47) {
    // We're skipping this to fix a bad table migration.
    // skipped migration is added as version 51
    currentDSL.version = 48;
  }

  if (currentDSL.version === 48) {
    currentDSL = migrateRecaptchaType(currentDSL);
    currentDSL.version = 49;
  }

  if (currentDSL.version === 49) {
    currentDSL = addPrivateWidgetsToAllListWidgets(currentDSL);
    currentDSL.version = 50;
  }

  if (currentDSL.version === 50) {
    /*
     * We're skipping this to fix a bad table migration - migrateTableWidgetNumericColumnName
     * it overwrites the computedValue of the table columns
     */

    currentDSL.version = 51;
  }

  if (currentDSL.version === 51) {
    currentDSL = migratePhoneInputWidgetAllowFormatting(currentDSL);
    currentDSL.version = 52;
  }

  if (currentDSL.version === 52) {
    currentDSL = migrateModalIconButtonWidget(currentDSL);
    currentDSL.version = 53;
  }

  if (currentDSL.version === 53) {
    currentDSL = migrateScrollTruncateProperties(currentDSL);
    currentDSL.version = 54;
  }

  if (currentDSL.version === 54) {
    currentDSL = migratePhoneInputWidgetDefaultDialCode(currentDSL);
    currentDSL.version = 55;
  }

  if (currentDSL.version === 55) {
    currentDSL = migrateCurrencyInputWidgetDefaultCurrencyCode(currentDSL);
    currentDSL.version = 56;
  }

  if (currentDSL.version === 56) {
    currentDSL = migrateRadioGroupAlignmentProperty(currentDSL);
    currentDSL.version = 57;
  }

  if (currentDSL.version === 57) {
    currentDSL = migrateStylingPropertiesForTheming(currentDSL);
    currentDSL.version = 58;
  }

  if (currentDSL.version === 58) {
    currentDSL = migrateCheckboxSwitchProperty(currentDSL);
    currentDSL.version = 59;
  }

  if (currentDSL.version === 59) {
    /**
     * migrateChartWidgetReskinningData function will be executed again in version 61,
     * since for older apps the accentColor and fontFamily didn't get migrated.
     */
    currentDSL = migrateChartWidgetReskinningData(currentDSL);
    currentDSL.version = 60;
  }

  if (currentDSL.version === 60) {
    currentDSL = migrateTableWidgetV2Validation(currentDSL);
    currentDSL.version = 61;
  }

  if (currentDSL.version === 61) {
    currentDSL = migrateChartWidgetReskinningData(currentDSL);
    currentDSL.version = 62;
  }

  if (currentDSL.version === 62) {
    currentDSL = MigrateSelectTypeWidgetDefaultValue(currentDSL);
    currentDSL.version = 63;
  }

  if (currentDSL.version === 63) {
    currentDSL = migrateMapChartWidgetReskinningData(currentDSL);
    currentDSL.version = 64;
  }

  if (currentDSL.version === 64) {
    currentDSL = migrateRateWidgetDisabledState(currentDSL);
    currentDSL.version = 65;
  }

  if (currentDSL.version === 65) {
    currentDSL = migrateCodeScannerLayout(currentDSL);
    currentDSL.version = 66;
  }

  if (currentDSL.version === 66) {
    currentDSL = migrateTableWidgetV2ValidationBinding(currentDSL);
    currentDSL.version = 67;
  }

  if (currentDSL.version === 67) {
    currentDSL = migrateLabelPosition(currentDSL);
    currentDSL.version = 68;
  }

  if (currentDSL.version === 68) {
    currentDSL = migratePropertiesForDynamicHeight(currentDSL);
    currentDSL.version = 69;
  }

  if (currentDSL.version === 69) {
    currentDSL = migrateMenuButtonDynamicItems(currentDSL);
    currentDSL.version = 70;
  }

  if (currentDSL.version === 70) {
    currentDSL = migrateChildStylesheetFromDynamicBindingPathList(currentDSL);
    currentDSL.version = 71;
  }

  if (currentDSL.version === 71) {
    currentDSL = migrateTableWidgetV2SelectOption(currentDSL);
    currentDSL.version = 72;
  }

  if (currentDSL.version === 72) {
    currentDSL = migrateListWidgetChildrenForAutoHeight(currentDSL);
    currentDSL.version = 73;
  }

  if (currentDSL.version === 73) {
    currentDSL = migrateInputWidgetShowStepArrows(currentDSL);
    currentDSL.version = 74;
  }

  if (currentDSL.version === 74) {
    currentDSL = migrateMenuButtonDynamicItemsInsideTableWidget(currentDSL);
    currentDSL.version = 75;
  }

  if (currentDSL.version === 75) {
    currentDSL = migrateInputWidgetsMultiLineInputType(currentDSL);
    currentDSL.version = 76;
  }

  if (currentDSL.version === 76) {
    currentDSL = migrateColumnFreezeAttributes(currentDSL);
    currentDSL.version = 77;
  }

  if (currentDSL.version === 77) {
    currentDSL = migrateTableSelectOptionAttributesForNewRow(currentDSL);
    currentDSL.version = 78;
  }

  if (currentDSL.version == 78) {
    currentDSL =
      migrateBindingPrefixSuffixForInlineEditValidationControl(currentDSL);
    currentDSL.version = 79;
  }

  if (currentDSL.version == 79) {
    currentDSL = migrateTableWidgetTableDataJsMode(currentDSL);
    currentDSL.version = 80;
  }

  if (currentDSL.version === 80) {
    currentDSL = migrateSelectWidgetOptionToSourceData(currentDSL);
    currentDSL.version = 81;
  }

  if (currentDSL.version === 81) {
    currentDSL = migrateSelectWidgetSourceDataBindingPathList(currentDSL);
    currentDSL.version = 82;
  }

  if (currentDSL.version == 82) {
    currentDSL = migrateChartWidgetLabelOrientationStaggerOption(currentDSL);
    currentDSL.version = 83;
  }

  if (currentDSL.version == 83) {
    currentDSL = migrateAddShowHideDataPointLabels(currentDSL);
    currentDSL.version = 84;
  }

  if (currentDSL.version === 84) {
    currentDSL = migrateSelectWidgetAddSourceDataPropertyPathList(currentDSL);
    currentDSL.version = 85;
  }

  if (currentDSL.version === 85) {
    currentDSL = migrateDefaultValuesForCustomEChart(currentDSL);
    currentDSL.version = LATEST_PAGE_VERSION;
  }

  return currentDSL;
};
