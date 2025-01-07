import { flattenDSL } from "../transform";
import { updateContainers } from "./migrations/001-update-containers";
import { chartDataMigration } from "./migrations/002-chart-data-migration";
import { mapDataMigration } from "./migrations/003-map-data-migration";
import { singleChartDataMigration } from "./migrations/004-single-chart-data-migration";
import { tabsWidgetTabsPropertyMigration } from "./migrations/005-tabs-widget-property-migration";
import { dynamicPathListMigration } from "./migrations/006-dynamic-path-list-migration";
import { canvasNameConflictMigration } from "./migrations/007-canvas-name-conflict-migration";
import { renamedCanvasNameConflictMigration } from "./migrations/008-renamed-canvas-name-conflict-migration";
import { tableWidgetPropertyPaneMigrations } from "./migrations/009-table-widget-property-pane-migration";
import { addVersionNumberMigration } from "./migrations/010-add-version-number-migration";
import { migrateTablePrimaryColumnsBindings } from "./migrations/011-migrate-table-primary-columns-binding";
import { migrateIncorrectDynamicBindingPathLists } from "./migrations/012-migrate-incorrect-dynamic-binding-path-lists";
import { migrateOldChartData } from "./migrations/013-migrate-old-chart-data";
import { rteDefaultValueMigration } from "./migrations/014-rte-default-value-migration";
import { migrateTextStyleFromTextWidget } from "./migrations/015-migrate-text-style-from-text-widget";
import { migrateChartDataFromArrayToObject } from "./migrations/016-migrate-chart-data-from-array-to-object";
import { migrateTabsData } from "./migrations/017-migrate-tabs-data";
import { migrateInitialValues } from "./migrations/018-migrate-initial-values";
import {
  getCanvasSnapRows,
  migrateToNewLayout,
} from "./migrations/019-migrate-to-new-layout";
import { migrateNewlyAddedTabsWidgetsMissingData } from "./migrations/020-migrate-newly-added-tabs-widgets-missing-data";
import {
  migrateOverFlowingTabsWidgets,
  migrateWidgetsWithoutLeftRightColumns,
} from "./migrations/021-migrate-overflowing-tabs-widgets";
import { migrateTableWidgetParentRowSpaceProperty } from "./migrations/022-migrate-table-widget-parent-row-space-property";
import { addLogBlackListToAllListWidgetChildren } from "./migrations/023-add-log-blacklist-to-all-widget-children";
import { migrateTableWidgetHeaderVisibilityProperties } from "./migrations/024-migrate-table-widget-header-visibility-properties";
import { migrateItemsToListDataInListWidget } from "./migrations/025-migrate-items-to-list-data-in-list-widget";
import { migrateDatePickerMinMaxDate } from "./migrations/026-migrate-datepicker-min-max-date";
import { migrateFilterValueForDropDownWidget } from "./migrations/027-migrate-filter-value-for-dropdown-widget";
import { migrateTablePrimaryColumnsComputedValue } from "./migrations/028-migrate-table-primary-columns-computed-value";
import { migrateToNewMultiSelect } from "./migrations/029-migrate-to-new-multiselect";
import { migrateTableWidgetDelimiterProperties } from "./migrations/030-migrate-table-widget-delimiter-properties";
import { migrateIsDisabledToButtonColumn } from "./migrations/031-migrate-is-disabled-to-button-column";
import { migrateTableDefaultSelectedRow } from "./migrations/032-migrate-table-default-selected-row";
import { migrateMenuButtonWidgetButtonProperties } from "./migrations/033-migrate-menu-button-widget-button-properties";
import { migrateButtonWidgetValidation } from "./migrations/034-migrate-button-widget-validation";
import { migrateInputValidation } from "./migrations/035-migrate-input-validation";
import { revertTableDefaultSelectedRow } from "./migrations/036-revert-table-default-selected-row";
import { migrateTableSanitizeColumnKeys } from "./migrations/037-migrate-table-sanitize-column-keys";
import { migrateResizableModalWidgetProperties } from "./migrations/038-migrate-resizable-modal-widget-properties";
import { migrateTableWidgetSelectedRowBindings } from "./migrations/039-migrate-table-widget-selected-row-bindings";
import { revertButtonStyleToButtonColor } from "./migrations/040-revert-button-style-to-button-color";
import { migrateButtonVariant } from "./migrations/041-migrate-button-variant";
import { migrateMapWidgetIsClickedMarkerCentered } from "./migrations/042-migrate-map-widget-is-clicked-marker-centered";
import { mapAllowHorizontalScrollMigration } from "./migrations/043-map-allow-horizontal-scroll-mirgation";
import { isSortableMigration } from "./migrations/044-is-sortable-migration";
import { migrateTableWidgetIconButtonVariant } from "./migrations/045-migrate-table-widget-icon-button-variant";
import { migrateCheckboxGroupWidgetInlineProperty } from "./migrations/046-migrate-checkbox-group-widget-inline-property";
import { migrateRecaptchaType } from "./migrations/048-migrate-recaptcha-type";
import { addPrivateWidgetsToAllListWidgets } from "./migrations/049-add-private-widgets-to-all-list-widgets";
import { migratePhoneInputWidgetAllowFormatting } from "./migrations/051-migrate-phone-input-widget-allow-formatting";
import { migrateModalIconButtonWidget } from "./migrations/052-migrate-modal-icon-button-widget";
import { migrateScrollTruncateProperties } from "./migrations/053-migrate-scroll-truncate-property";
import { migratePhoneInputWidgetDefaultDialCode } from "./migrations/054-migrate-phone-input-widget-default-dial-code";
import { migrateCurrencyInputWidgetDefaultCurrencyCode } from "./migrations/055-migrate-currency-input-widget-default-currency-code";
import { migrateRadioGroupAlignmentProperty } from "./migrations/056-migrate-radio-group-alignment-property";
import { migrateStylingPropertiesForTheming } from "./migrations/057-migrate-styling-properties-for-theming";
import { migrateCheckboxSwitchProperty } from "./migrations/058-migrate-checkbox-switch-property";
import { migrateChartWidgetReskinningData } from "./migrations/059-migrate-chart-widget-reskinning-data";
import { migrateTableWidgetV2Validation } from "./migrations/060-migrate-table-widget-v2-validation";
import { MigrateSelectTypeWidgetDefaultValue } from "./migrations/062-migrate-select-type-widget-default-value";
import { migrateMapChartWidgetReskinningData } from "./migrations/063-migrate-map-chart-widget-reskinning-data";
import { migrateRateWidgetDisabledState } from "./migrations/064-migrate-rate-widget-disabed-state";
import { migrateCodeScannerLayout } from "./migrations/065-migrate-code-scanner-layout";
import { migrateTableWidgetV2ValidationBinding } from "./migrations/066-migrate-table-widget-v2-validation-binding";
import { migrateLabelPosition } from "./migrations/067-migrate-label-position";
import { migratePropertiesForDynamicHeight } from "./migrations/068-migrate-properties-for-dynamic-height";
import { migrateMenuButtonDynamicItems } from "./migrations/069-migrate-menu-button-dynamic-items";
import { migrateChildStylesheetFromDynamicBindingPathList } from "./migrations/070-migrate-child-stylesheet-from-dynamic-binding-path-list";
import { migrateTableWidgetV2SelectOption } from "./migrations/071-migrate-table-widget-v2-select-option";
import { migrateListWidgetChildrenForAutoHeight } from "./migrations/072-migrate-list-widget-children-for-auto-height";
import { migrateInputWidgetShowStepArrows } from "./migrations/073-mirgate-input-widget-show-step-arrows";
import { migrateMenuButtonDynamicItemsInsideTableWidget } from "./migrations/074-migrate-mwnu-button-dynamic-items-inside-table-widget";
import { migrateInputWidgetsMultiLineInputType } from "./migrations/075-migrate-input-widgets-multiline-input-type";
import { migrateColumnFreezeAttributes } from "./migrations/076-migrate-column-freeze-attributes";
import { migrateTableSelectOptionAttributesForNewRow } from "./migrations/077-migrate-table-select-option-attributes-for-new-row";
import { migrateBindingPrefixSuffixForInlineEditValidationControl } from "./migrations/078-migrate-binding-prefix-suffix-for-inline-edit-validation-control";
import { migrateTableWidgetTableDataJsMode } from "./migrations/079-migrate-table-widget-table-data-js-mode";
import { migrateSelectWidgetOptionToSourceData } from "./migrations/080-migrate-select-widget-option-to-source-data";
import { migrateSelectWidgetSourceDataBindingPathList } from "./migrations/081-migrate-select-widget-source-data-binding-path-list";
import { migrateChartWidgetLabelOrientationStaggerOption } from "./migrations/082-migrate-chart-widget-label-orientation-stagger-option";
import { migrateAddShowHideDataPointLabels } from "./migrations/083-migrate-add-show-hide-data-point-labels";
import { migrateSelectWidgetAddSourceDataPropertyPathList } from "./migrations/084-migrate-select-widget-add-source-data-property-path-list";
import { migrateDefaultValuesForCustomEChart } from "./migrations/085-migrate-default-values-for-custom-echart";
import { migrateTableServerSideFiltering } from "./migrations/086-migrate-table-server-side-filtering";
import { migrateChartwidgetCustomEchartConfig } from "./migrations/087-migrate-chart-widget-customechartdata";
import { migrateCustomWidgetDynamicHeight } from "./migrations/088-migrate-custom-widget-dynamic-height";
import { migrateJsonFormWidgetLabelPositonAndAlignment } from "./migrations/090-migrate-jsonformwidget-labelposition-and-alignment";
import { migrateTableWidgetV2CurrentRowInValidationsBinding } from "./migrations/089-migrage-table-widget-v2-currentRow-binding";
import type { DSLWidget } from "./types";

export const LATEST_DSL_VERSION = 91;

export const calculateDynamicHeight = () => {
  const DEFAULT_GRID_ROW_HEIGHT = 10;
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 600;
  const gridRowHeight = DEFAULT_GRID_ROW_HEIGHT;
  // DGRH - DEFAULT_GRID_ROW_HEIGHT
  // View Mode: Header height + Page Selection Tab = 8 * DGRH (approx)
  // Edit Mode: Header height + Canvas control = 8 * DGRH (approx)
  // buffer: ~8 grid row height
  const buffer =
    gridRowHeight +
    2 * 48 /*pixelToNumber(theme.smallHeaderHeight) */ +
    37; /*pixelToNumber(theme.bottomBarHeight);*/
  const calculatedMinHeight =
    Math.floor((screenHeight - buffer) / gridRowHeight) * gridRowHeight;

  return calculatedMinHeight;
};

const migrateUnversionedDSL = (currentDSL: DSLWidget) => {
  const DEFAULT_GRID_ROW_HEIGHT = 10;

  if (currentDSL.version === undefined) {
    // Since this top level widget is a CANVAS_WIDGET,
    // DropTargetComponent needs to know the minimum height the canvas can take
    // See DropTargetUtils.ts
    currentDSL.minHeight = calculateDynamicHeight();
    currentDSL.bottomRow = currentDSL.minHeight - DEFAULT_GRID_ROW_HEIGHT;
    // For the first time the DSL is created, remove one row from the total possible rows
    // to adjust for padding and margins.
    currentDSL.snapRows =
      Math.floor(currentDSL.bottomRow / DEFAULT_GRID_ROW_HEIGHT) - 1;

    // Force the width of the canvas to 1224 px
    currentDSL.rightColumn = 1224;
    // The canvas is a CANVAS_WIDGET which doesn't have a background or borders by default
    currentDSL.backgroundColor = "none";
    currentDSL.containerStyle = "none";
    currentDSL.type = "CANVAS_WIDGET";
    currentDSL.detachFromLayout = true;
    currentDSL.canExtend = true;

    // Update version to make sure this doesn't run every time.
    currentDSL.version = 1;
  }

  return currentDSL;
};

// A rudimentary transform function which updates the DSL based on its version.
// A more modular approach needs to be designed.
// This needs the widget config to be already built to migrate correctly
const migrateVersionedDSL = async (currentDSL: DSLWidget, newPage = false) => {
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
    currentDSL = await migrateIncorrectDynamicBindingPathLists(currentDSL);
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
    currentDSL.version = 86;
  }

  if (currentDSL.version === 86) {
    currentDSL = migrateTableServerSideFiltering(currentDSL);
    currentDSL.version = 87;
  }

  if (currentDSL.version === 87) {
    currentDSL = migrateChartwidgetCustomEchartConfig(currentDSL);
    currentDSL.version = 88;
  }

  if (currentDSL.version === 88) {
    currentDSL = migrateCustomWidgetDynamicHeight(currentDSL);
    currentDSL.version = 89;
  }

  if (currentDSL.version === 89) {
    currentDSL = migrateTableWidgetV2CurrentRowInValidationsBinding(currentDSL);
    currentDSL.version = LATEST_DSL_VERSION;
  }

  if (currentDSL.version === 90) {
    currentDSL = migrateJsonFormWidgetLabelPositonAndAlignment(currentDSL);
    currentDSL.version = LATEST_DSL_VERSION;
  }


  return currentDSL;
};

export const migrateDSL = async (
  currentDSL: DSLWidget,
  newPage = false,
): Promise<DSLWidget> => {
  if (currentDSL.version === undefined) {
    const initialDSL = migrateUnversionedDSL(currentDSL);

    return (await migrateVersionedDSL(initialDSL, newPage)) as DSLWidget;
  } else {
    return (await migrateVersionedDSL(currentDSL, newPage)) as DSLWidget;
  }
};
