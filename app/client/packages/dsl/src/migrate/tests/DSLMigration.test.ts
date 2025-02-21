/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DSLMigrations from "..";
import type { DSLWidget } from "../types";
import { originalDSLForDSLMigrations } from "./testDSLs";

import * as m1 from "../migrations/001-update-containers";
import * as m2 from "../migrations/002-chart-data-migration";
import * as m3 from "../migrations/003-map-data-migration";
import * as m4 from "../migrations/004-single-chart-data-migration";
import * as m5 from "../migrations/005-tabs-widget-property-migration";
import * as m6 from "../migrations/006-dynamic-path-list-migration";
import * as m7 from "../migrations/007-canvas-name-conflict-migration";
import * as m8 from "../migrations/008-renamed-canvas-name-conflict-migration";
import * as m9 from "../migrations/009-table-widget-property-pane-migration";
import * as m10 from "../migrations/010-add-version-number-migration";
import * as m11 from "../migrations/011-migrate-table-primary-columns-binding";
import * as m12 from "../migrations/012-migrate-incorrect-dynamic-binding-path-lists";
import * as m13 from "../migrations/013-migrate-old-chart-data";
import * as m14 from "../migrations/014-rte-default-value-migration";
import * as m15 from "../migrations/015-migrate-text-style-from-text-widget";
import * as m16 from "../migrations/016-migrate-chart-data-from-array-to-object";
import * as m17 from "../migrations/017-migrate-tabs-data";
import * as m18 from "../migrations/018-migrate-initial-values";
import * as m19 from "../migrations/019-migrate-to-new-layout";
import * as m20 from "../migrations/020-migrate-newly-added-tabs-widgets-missing-data";
import * as m21 from "../migrations/021-migrate-overflowing-tabs-widgets";
import * as m22 from "../migrations/022-migrate-table-widget-parent-row-space-property";
import * as m23 from "../migrations/023-add-log-blacklist-to-all-widget-children";
import * as m24 from "../migrations/024-migrate-table-widget-header-visibility-properties";
import * as m25 from "../migrations/025-migrate-items-to-list-data-in-list-widget";
import * as m26 from "../migrations/026-migrate-datepicker-min-max-date";
import * as m27 from "../migrations/027-migrate-filter-value-for-dropdown-widget";
import * as m28 from "../migrations/028-migrate-table-primary-columns-computed-value";
import * as m29 from "../migrations/029-migrate-to-new-multiselect";
import * as m30 from "../migrations/030-migrate-table-widget-delimiter-properties";
import * as m31 from "../migrations/031-migrate-is-disabled-to-button-column";
import * as m32 from "../migrations/032-migrate-table-default-selected-row";
import * as m33 from "../migrations/033-migrate-menu-button-widget-button-properties";
import * as m34 from "../migrations/034-migrate-button-widget-validation";
import * as m35 from "../migrations/035-migrate-input-validation";
import * as m36 from "../migrations/036-revert-table-default-selected-row";
import * as m37 from "../migrations/037-migrate-table-sanitize-column-keys";
import * as m38 from "../migrations/038-migrate-resizable-modal-widget-properties";
import * as m39 from "../migrations/039-migrate-table-widget-selected-row-bindings";
import * as m40 from "../migrations/040-revert-button-style-to-button-color";
import * as m41 from "../migrations/041-migrate-button-variant";
import * as m42 from "../migrations/042-migrate-map-widget-is-clicked-marker-centered";
import * as m43 from "../migrations/043-map-allow-horizontal-scroll-mirgation";
import * as m44 from "../migrations/044-is-sortable-migration";
import * as m45 from "../migrations/045-migrate-table-widget-icon-button-variant";
import * as m46 from "../migrations/046-migrate-checkbox-group-widget-inline-property";
import * as m48 from "../migrations/048-migrate-recaptcha-type";
import * as m49 from "../migrations/049-add-private-widgets-to-all-list-widgets";
import * as m51 from "../migrations/051-migrate-phone-input-widget-allow-formatting";
import * as m52 from "../migrations/052-migrate-modal-icon-button-widget";
import * as m53 from "../migrations/053-migrate-scroll-truncate-property";
import * as m54 from "../migrations/054-migrate-phone-input-widget-default-dial-code";
import * as m55 from "../migrations/055-migrate-currency-input-widget-default-currency-code";
import * as m56 from "../migrations/056-migrate-radio-group-alignment-property";
import * as m57 from "../migrations/057-migrate-styling-properties-for-theming";
import * as m58 from "../migrations/058-migrate-checkbox-switch-property";
import * as m59 from "../migrations/059-migrate-chart-widget-reskinning-data";
import * as m60 from "../migrations/060-migrate-table-widget-v2-validation";
import * as m62 from "../migrations/062-migrate-select-type-widget-default-value";
import * as m63 from "../migrations/063-migrate-map-chart-widget-reskinning-data";
import * as m64 from "../migrations/064-migrate-rate-widget-disabed-state";
import * as m65 from "../migrations/065-migrate-code-scanner-layout";
import * as m66 from "../migrations/066-migrate-table-widget-v2-validation-binding";
import * as m67 from "../migrations/067-migrate-label-position";
import * as m68 from "../migrations/068-migrate-properties-for-dynamic-height";
import * as m69 from "../migrations/069-migrate-menu-button-dynamic-items";
import * as m70 from "../migrations/070-migrate-child-stylesheet-from-dynamic-binding-path-list";
import * as m71 from "../migrations/071-migrate-table-widget-v2-select-option";
import * as m72 from "../migrations/072-migrate-list-widget-children-for-auto-height";
import * as m73 from "../migrations/073-mirgate-input-widget-show-step-arrows";
import * as m74 from "../migrations/074-migrate-mwnu-button-dynamic-items-inside-table-widget";
import * as m75 from "../migrations/075-migrate-input-widgets-multiline-input-type";
import * as m76 from "../migrations/076-migrate-column-freeze-attributes";
import * as m77 from "../migrations/077-migrate-table-select-option-attributes-for-new-row";
import * as m78 from "../migrations/078-migrate-binding-prefix-suffix-for-inline-edit-validation-control";
import * as m79 from "../migrations/079-migrate-table-widget-table-data-js-mode";
import * as m80 from "../migrations/080-migrate-select-widget-option-to-source-data";
import * as m81 from "../migrations/081-migrate-select-widget-source-data-binding-path-list";
import * as m82 from "../migrations/082-migrate-chart-widget-label-orientation-stagger-option";
import * as m83 from "../migrations/083-migrate-add-show-hide-data-point-labels";
import * as m84 from "../migrations/084-migrate-select-widget-add-source-data-property-path-list";
import * as m85 from "../migrations/085-migrate-default-values-for-custom-echart";
import * as m86 from "../migrations/086-migrate-table-server-side-filtering";
import * as m87 from "../migrations/087-migrate-chart-widget-customechartdata";
import * as m88 from "../migrations/088-migrate-custom-widget-dynamic-height";
import * as m89 from "../migrations/089-migrage-table-widget-v2-currentRow-binding";
import * as m90 from "../migrations/090-migrate-table-compute-value-binding";

interface Migration {
  functionLookup: {
    moduleObj: any;
    functionName: string;
  }[];
  version: number | undefined;
}

/**
 * Migrations is an array of objects, were each object has
 * - moduleObj: A namespace import that includes all the exported function present in the module. Refer to line 3.
 * - functionName: Name of the migration function to spyOn
 * - version: The DSL version in which the function is executing
 *
 * Migrations will be used to construct mockFnObj object where mockFnObj's key is the version and value is an array of jest mock functions.
 *
 * NOTE:
 * - In Migrations the sequence of object should exactly match the sequence that is present in the migrateDSL function.
 *
 * - For cases were migration is skipped, we include them in Migrations.
 *   Simply add the object with functionLookup and version of the skipped migration.
 *   Refer to the skippedMigration50 object inside Migrations
 */
const migrations: Migration[] = [
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "calculateDynamicHeight",
      },
    ],
    version: undefined,
  },
  {
    functionLookup: [
      {
        moduleObj: m1,
        functionName: "updateContainers",
      },
    ],
    version: 1,
  },
  {
    functionLookup: [
      {
        moduleObj: m2,
        functionName: "chartDataMigration",
      },
    ],
    version: 2,
  },
  {
    functionLookup: [
      {
        moduleObj: m3,
        functionName: "mapDataMigration",
      },
    ],
    version: 3,
  },
  {
    functionLookup: [
      {
        moduleObj: m4,
        functionName: "singleChartDataMigration",
      },
    ],
    version: 4,
  },
  {
    functionLookup: [
      {
        moduleObj: m5,
        functionName: "tabsWidgetTabsPropertyMigration",
      },
    ],
    version: 5,
  },
  {
    functionLookup: [
      {
        moduleObj: m6,
        functionName: "dynamicPathListMigration",
      },
    ],
    version: 6,
  },
  {
    functionLookup: [
      {
        moduleObj: m7,
        functionName: "canvasNameConflictMigration",
      },
    ],
    version: 7,
  },
  {
    functionLookup: [
      {
        moduleObj: m8,
        functionName: "renamedCanvasNameConflictMigration",
      },
    ],
    version: 8,
  },
  {
    functionLookup: [
      {
        moduleObj: m9,
        functionName: "tableWidgetPropertyPaneMigrations",
      },
    ],
    version: 9,
  },
  {
    functionLookup: [
      {
        moduleObj: m10,
        functionName: "addVersionNumberMigration",
      },
    ],
    version: 10,
  },
  {
    functionLookup: [
      {
        moduleObj: m11,
        functionName: "migrateTablePrimaryColumnsBindings",
      },
    ],
    version: 11,
  },
  {
    functionLookup: [
      {
        moduleObj: m12,
        functionName: "migrateIncorrectDynamicBindingPathLists",
      },
    ],
    version: 12,
  },
  {
    functionLookup: [
      {
        moduleObj: m13,
        functionName: "migrateOldChartData",
      },
    ],
    version: 13,
  },
  {
    functionLookup: [
      {
        moduleObj: m14,
        functionName: "rteDefaultValueMigration",
      },
    ],
    version: 14,
  },
  {
    functionLookup: [
      {
        moduleObj: m15,
        functionName: "migrateTextStyleFromTextWidget",
      },
    ],
    version: 15,
  },
  {
    functionLookup: [
      {
        moduleObj: m16,
        functionName: "migrateChartDataFromArrayToObject",
      },
    ],
    version: 16,
  },
  {
    functionLookup: [
      {
        moduleObj: m17,
        functionName: "migrateTabsData",
      },
    ],
    version: 17,
  },
  {
    functionLookup: [
      {
        moduleObj: m18,
        functionName: "migrateInitialValues",
      },
    ],
    version: 18,
  },
  {
    functionLookup: [
      {
        moduleObj: m19,
        functionName: "migrateToNewLayout",
      },
    ],
    version: 19,
  },
  {
    functionLookup: [
      {
        moduleObj: m20,
        functionName: "migrateNewlyAddedTabsWidgetsMissingData",
      },
    ],
    version: 20,
  },
  {
    functionLookup: [
      {
        moduleObj: m21,
        functionName: "migrateWidgetsWithoutLeftRightColumns",
      },
      {
        moduleObj: m21,
        functionName: "migrateOverFlowingTabsWidgets",
      },
    ],
    version: 21,
  },
  {
    functionLookup: [
      {
        moduleObj: m22,
        functionName: "migrateTableWidgetParentRowSpaceProperty",
      },
    ],
    version: 22,
  },
  {
    functionLookup: [
      {
        moduleObj: m23,
        functionName: "addLogBlackListToAllListWidgetChildren",
      },
    ],
    version: 23,
  },
  {
    functionLookup: [
      {
        moduleObj: m24,
        functionName: "migrateTableWidgetHeaderVisibilityProperties",
      },
    ],
    version: 24,
  },
  {
    functionLookup: [
      {
        moduleObj: m25,
        functionName: "migrateItemsToListDataInListWidget",
      },
    ],
    version: 25,
  },
  {
    functionLookup: [
      {
        moduleObj: m26,
        functionName: "migrateDatePickerMinMaxDate",
      },
    ],
    version: 26,
  },
  {
    functionLookup: [
      {
        moduleObj: m27,
        functionName: "migrateFilterValueForDropDownWidget",
      },
    ],
    version: 27,
  },
  {
    functionLookup: [
      {
        moduleObj: m28,
        functionName: "migrateTablePrimaryColumnsComputedValue",
      },
    ],
    version: 28,
  },
  {
    functionLookup: [
      {
        moduleObj: m29,
        functionName: "migrateToNewMultiSelect",
      },
    ],
    version: 29,
  },
  {
    functionLookup: [
      {
        moduleObj: m30,
        functionName: "migrateTableWidgetDelimiterProperties",
      },
    ],
    version: 30,
  },
  {
    functionLookup: [
      {
        moduleObj: m31,
        functionName: "migrateIsDisabledToButtonColumn",
      },
    ],
    version: 31,
  },
  {
    functionLookup: [
      {
        moduleObj: m32,
        functionName: "migrateTableDefaultSelectedRow",
      },
    ],
    version: 32,
  },
  {
    functionLookup: [
      {
        moduleObj: m33,
        functionName: "migrateMenuButtonWidgetButtonProperties",
      },
    ],
    version: 33,
  },
  {
    functionLookup: [
      {
        moduleObj: m34,
        functionName: "migrateButtonWidgetValidation",
      },
    ],
    version: 34,
  },
  {
    functionLookup: [
      {
        moduleObj: m35,
        functionName: "migrateInputValidation",
      },
    ],
    version: 35,
  },
  {
    functionLookup: [
      {
        moduleObj: m36,
        functionName: "revertTableDefaultSelectedRow",
      },
    ],
    version: 36,
  },
  {
    functionLookup: [
      {
        moduleObj: m37,
        functionName: "migrateTableSanitizeColumnKeys",
      },
    ],
    version: 37,
  },
  {
    functionLookup: [
      {
        moduleObj: m38,
        functionName: "migrateResizableModalWidgetProperties",
      },
    ],
    version: 38,
  },
  {
    functionLookup: [
      {
        moduleObj: m39,
        functionName: "migrateTableWidgetSelectedRowBindings",
      },
    ],
    version: 39,
  },
  {
    functionLookup: [
      {
        moduleObj: m40,
        functionName: "revertButtonStyleToButtonColor",
      },
    ],
    version: 40,
  },
  {
    functionLookup: [
      {
        moduleObj: m41,
        functionName: "migrateButtonVariant",
      },
    ],
    version: 41,
  },
  {
    functionLookup: [
      {
        moduleObj: m42,
        functionName: "migrateMapWidgetIsClickedMarkerCentered",
      },
    ],
    version: 42,
  },
  {
    functionLookup: [
      {
        moduleObj: m43,
        functionName: "mapAllowHorizontalScrollMigration",
      },
    ],
    version: 43,
  },
  {
    functionLookup: [
      {
        moduleObj: m44,
        functionName: "isSortableMigration",
      },
    ],
    version: 44,
  },
  {
    functionLookup: [
      {
        moduleObj: m45,
        functionName: "migrateTableWidgetIconButtonVariant",
      },
    ],
    version: 45,
  },
  {
    functionLookup: [
      {
        moduleObj: m46,
        functionName: "migrateCheckboxGroupWidgetInlineProperty",
      },
    ],
    version: 46,
  },
  {
    functionLookup: [
      {
        moduleObj: "",
        functionName: "skippedMigration47",
      },
    ],
    version: 47,
  },
  {
    functionLookup: [
      {
        moduleObj: m48,
        functionName: "migrateRecaptchaType",
      },
    ],
    version: 48,
  },
  {
    functionLookup: [
      {
        moduleObj: m49,
        functionName: "addPrivateWidgetsToAllListWidgets",
      },
    ],
    version: 49,
  },
  {
    functionLookup: [
      {
        moduleObj: "",
        functionName: "skippedMigration50",
      },
    ],
    version: 50,
  },
  {
    functionLookup: [
      {
        moduleObj: m51,
        functionName: "migratePhoneInputWidgetAllowFormatting",
      },
    ],
    version: 51,
  },
  {
    functionLookup: [
      {
        moduleObj: m52,
        functionName: "migrateModalIconButtonWidget",
      },
    ],
    version: 52,
  },
  {
    functionLookup: [
      {
        moduleObj: m53,
        functionName: "migrateScrollTruncateProperties",
      },
    ],
    version: 53,
  },
  {
    functionLookup: [
      {
        moduleObj: m54,
        functionName: "migratePhoneInputWidgetDefaultDialCode",
      },
    ],
    version: 54,
  },
  {
    functionLookup: [
      {
        moduleObj: m55,
        functionName: "migrateCurrencyInputWidgetDefaultCurrencyCode",
      },
    ],
    version: 55,
  },
  {
    functionLookup: [
      {
        moduleObj: m56,
        functionName: "migrateRadioGroupAlignmentProperty",
      },
    ],
    version: 56,
  },
  {
    functionLookup: [
      {
        moduleObj: m57,
        functionName: "migrateStylingPropertiesForTheming",
      },
    ],
    version: 57,
  },
  {
    functionLookup: [
      {
        moduleObj: m58,
        functionName: "migrateCheckboxSwitchProperty",
      },
    ],
    version: 58,
  },
  {
    functionLookup: [
      {
        moduleObj: m59,
        functionName: "migrateChartWidgetReskinningData",
      },
    ],
    version: 59,
  },
  {
    functionLookup: [
      {
        moduleObj: m60,
        functionName: "migrateTableWidgetV2Validation",
      },
    ],
    version: 60,
  },
  {
    functionLookup: [
      {
        moduleObj: m59,
        functionName: "migrateChartWidgetReskinningData",
      },
    ],
    version: 61,
  },
  {
    functionLookup: [
      {
        moduleObj: m62,
        functionName: "MigrateSelectTypeWidgetDefaultValue",
      },
    ],
    version: 62,
  },
  {
    functionLookup: [
      {
        moduleObj: m63,
        functionName: "migrateMapChartWidgetReskinningData",
      },
    ],
    version: 63,
  },
  {
    functionLookup: [
      {
        moduleObj: m64,
        functionName: "migrateRateWidgetDisabledState",
      },
    ],
    version: 64,
  },
  {
    functionLookup: [
      {
        moduleObj: m65,
        functionName: "migrateCodeScannerLayout",
      },
    ],
    version: 65,
  },
  {
    functionLookup: [
      {
        moduleObj: m66,
        functionName: "migrateTableWidgetV2ValidationBinding",
      },
    ],
    version: 66,
  },
  {
    functionLookup: [
      {
        moduleObj: m67,
        functionName: "migrateLabelPosition",
      },
    ],
    version: 67,
  },
  {
    functionLookup: [
      {
        moduleObj: m68,
        functionName: "migratePropertiesForDynamicHeight",
      },
    ],
    version: 68,
  },
  {
    functionLookup: [
      {
        moduleObj: m69,
        functionName: "migrateMenuButtonDynamicItems",
      },
    ],
    version: 69,
  },
  {
    functionLookup: [
      {
        moduleObj: m70,
        functionName: "migrateChildStylesheetFromDynamicBindingPathList",
      },
    ],
    version: 70,
  },
  {
    functionLookup: [
      {
        moduleObj: m71,
        functionName: "migrateTableWidgetV2SelectOption",
      },
    ],
    version: 71,
  },
  {
    functionLookup: [
      {
        moduleObj: m72,
        functionName: "migrateListWidgetChildrenForAutoHeight",
      },
    ],
    version: 72,
  },
  {
    functionLookup: [
      {
        moduleObj: m73,
        functionName: "migrateInputWidgetShowStepArrows",
      },
    ],
    version: 73,
  },
  {
    functionLookup: [
      {
        moduleObj: m74,
        functionName: "migrateMenuButtonDynamicItemsInsideTableWidget",
      },
    ],
    version: 74,
  },
  {
    functionLookup: [
      {
        moduleObj: m75,
        functionName: "migrateInputWidgetsMultiLineInputType",
      },
    ],
    version: 75,
  },
  {
    functionLookup: [
      {
        moduleObj: m76,
        functionName: "migrateColumnFreezeAttributes",
      },
    ],
    version: 76,
  },
  {
    functionLookup: [
      {
        moduleObj: m77,
        functionName: "migrateTableSelectOptionAttributesForNewRow",
      },
    ],
    version: 77,
  },
  {
    functionLookup: [
      {
        moduleObj: m78,
        functionName:
          "migrateBindingPrefixSuffixForInlineEditValidationControl",
      },
    ],
    version: 78,
  },
  {
    functionLookup: [
      {
        moduleObj: m79,
        functionName: "migrateTableWidgetTableDataJsMode",
      },
    ],
    version: 79,
  },
  {
    functionLookup: [
      {
        moduleObj: m80,
        functionName: "migrateSelectWidgetOptionToSourceData",
      },
    ],
    version: 80,
  },
  {
    functionLookup: [
      {
        moduleObj: m81,
        functionName: "migrateSelectWidgetSourceDataBindingPathList",
      },
    ],
    version: 81,
  },
  {
    functionLookup: [
      {
        moduleObj: m82,
        functionName: "migrateChartWidgetLabelOrientationStaggerOption",
      },
    ],
    version: 82,
  },
  {
    functionLookup: [
      {
        moduleObj: m83,
        functionName: "migrateAddShowHideDataPointLabels",
      },
    ],
    version: 83,
  },
  {
    functionLookup: [
      {
        moduleObj: m84,
        functionName: "migrateSelectWidgetAddSourceDataPropertyPathList",
      },
    ],
    version: 84,
  },
  {
    functionLookup: [
      {
        moduleObj: m85,
        functionName: "migrateDefaultValuesForCustomEChart",
      },
    ],
    version: 85,
  },
  {
    functionLookup: [
      {
        moduleObj: m86,
        functionName: "migrateTableServerSideFiltering",
      },
    ],
    version: 86,
  },
  {
    functionLookup: [
      {
        moduleObj: m87,
        functionName: "migrateChartwidgetCustomEchartConfig",
      },
    ],
    version: 87,
  },
  {
    functionLookup: [
      {
        moduleObj: m88,
        functionName: "migrateCustomWidgetDynamicHeight",
      },
    ],
    version: 88,
  },
  {
    functionLookup: [
      {
        moduleObj: m89,
        functionName: "migrateTableWidgetV2CurrentRowInValidationsBinding",
      },
    ],
    version: 89,
  },
  {
    functionLookup: [
      {
        moduleObj: m90,
        functionName: "migrateTableComputeValueBinding",
      },
    ],
    version: 90,
  },
  {
    functionLookup: [],
    version: 91,
  },
];

const mockFnObj: Record<number, any> = {};

describe("Test all the migrations are running", () => {
  afterAll(() => {
    jest.clearAllMocks();
  });
  test("assert migration functions being called when migrate dsl has been called ", async () => {
    migrations.forEach((migration: Migration) => {
      /**
       * Generates mock fucntion for each migration function.
       * Mocks the implementation
       */
      const version = migration.version ?? 0;

      mockFnObj[version] = [];

      migration.functionLookup.forEach((lookup) => {
        const { functionName, moduleObj } = lookup;

        if (moduleObj) {
          mockFnObj[version].push({
            spyOnFunc: jest
              .spyOn(moduleObj, functionName)
              .mockImplementation((dsl: any) => {
                /**
                 * We need to delete the children property on the first migration(calculateDynamicHeight),
                 * to avoid the recursion in the second migration(updateContainers)
                 */
                dsl && delete dsl.children;

                return {
                  version: dsl?.version,
                  validationFuncName: functionName,
                };
              }),
          });
        }
      });
    });

    // Runs all the migrations
    await DSLMigrations.migrateDSL(
      originalDSLForDSLMigrations as unknown as DSLWidget,
    );

    migrations.forEach((item: any) => {
      const { functionLookup, version } = item;
      const dslVersion = version ?? 0;

      functionLookup.forEach(
        (lookup: { moduleObj: any; functionName: string }, index: number) => {
          const { functionName, moduleObj } = lookup;

          if (moduleObj) {
            const mockObj = mockFnObj[dslVersion][index].spyOnFunc;
            const calls = mockObj.mock?.calls;
            const results = mockObj.mock?.results;
            const resultsLastIdx = mockObj.mock.results.length - 1;

            // Check if the migration function is called
            expect(results[resultsLastIdx].value.validationFuncName).toEqual(
              functionName,
            );
            // Check if the migration function is called with the current DSL version
            calls.forEach((args: any) => {
              // Does functionName executes with the correct DSL version number
              if (args[0]?.version === version) {
                expect(args[0]?.version).toEqual(version);
              }

              // For a functionName is the correct DSL version registed in test cases
              expect(
                Object.keys(mockFnObj).includes(
                  args[0]?.version.toString() ?? "0",
                ),
              ).toBe(true);
            });
          }
        },
      );
    });
  });
  test("Check the migration count matches the lates page version", () => {
    expect(migrations.length).toEqual(DSLMigrations.LATEST_DSL_VERSION);
  });
});
