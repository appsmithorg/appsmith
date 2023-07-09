import type { WidgetProps } from "widgets/BaseWidget";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import * as DSLMigrations from "./DSLMigrations";
import * as chartWidgetReskinningMigrations from "./migrations/ChartWidgetReskinningMigrations";
import * as tableMigrations from "./migrations/TableWidget";
import * as IncorrectDynamicBindingPathLists from "./migrations/IncorrectDynamicBindingPathLists";
import * as TextStyleFromTextWidget from "./migrations/TextWidget";
import * as menuButtonWidgetMigrations from "./migrations/MenuButtonWidget";
import * as modalMigration from "./migrations/ModalWidget";
import * as mapWidgetMigration from "./migrations/MapWidget";
import * as checkboxMigration from "./migrations/CheckboxGroupWidget";
import * as buttonWidgetMigrations from "./migrations/ButtonWidgetMigrations";
import * as phoneInputMigration from "./migrations/PhoneInputWidgetMigrations";
import * as inputCurrencyMigration from "./migrations/CurrencyInputWidgetMigrations";
import * as radioGroupMigration from "./migrations/RadioGroupWidget";
import * as propertyPaneMigrations from "./migrations/PropertyPaneMigrations";
import * as themingMigration from "./migrations/ThemingMigrations";
import * as selectWidgetMigration from "./migrations/SelectWidget";
import * as mapChartReskinningMigrations from "./migrations/MapChartReskinningMigrations";
import { LATEST_PAGE_VERSION } from "constants/WidgetConstants";
import { originalDSLForDSLMigrations } from "./testDSLs";
import * as rateWidgetMigrations from "./migrations/RateWidgetMigrations";
import * as codeScannerWidgetMigrations from "./migrations/CodeScannerWidgetMigrations";
import * as migrateLabelPosition from "./migrations/MigrateLabelPosition";
import * as migrateAutoHeight from "./migrations/autoHeightMigrations";
import * as chartMigrations from "./migrations/ChartWidget";

type Migration = {
  functionLookup: {
    moduleObj: any;
    functionName: string;
  }[];
  version: number | undefined;
};

/**
 * Migrations is an array of objects, were each object has
 * - moduleObj: A namespace import that includes all the exported function present in the module. Refer to line 3.
 * - functionName: Name of the migration function to spyOn
 * - version: The DSL version in which the function is executing
 *
 * Migrations will be used to construct mockFnObj object where mockFnObj's key is the version and value is an array of jest mock functions.
 *
 * NOTE:
 * - In Migrations the sequence of object should exactly match the sequence that is present in the transformDSL function.
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
        moduleObj: DSLMigrations,
        functionName: "updateContainers",
      },
    ],
    version: 1,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "chartDataMigration",
      },
    ],
    version: 2,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "mapDataMigration",
      },
    ],
    version: 3,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "singleChartDataMigration",
      },
    ],
    version: 4,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "tabsWidgetTabsPropertyMigration",
      },
    ],
    version: 5,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "dynamicPathListMigration",
      },
    ],
    version: 6,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "canvasNameConflictMigration",
      },
    ],
    version: 7,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "renamedCanvasNameConflictMigration",
      },
    ],
    version: 8,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "tableWidgetPropertyPaneMigrations",
      },
    ],
    version: 9,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "addVersionNumberMigration",
      },
    ],
    version: 10,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTablePrimaryColumnsBindings",
      },
    ],
    version: 11,
  },
  {
    functionLookup: [
      {
        moduleObj: IncorrectDynamicBindingPathLists,
        functionName: "migrateIncorrectDynamicBindingPathLists",
      },
    ],
    version: 12,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateOldChartData",
      },
    ],
    version: 13,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "rteDefaultValueMigration",
      },
    ],
    version: 14,
  },
  {
    functionLookup: [
      {
        moduleObj: TextStyleFromTextWidget,
        functionName: "migrateTextStyleFromTextWidget",
      },
    ],
    version: 15,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateChartDataFromArrayToObject",
      },
    ],
    version: 16,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateTabsData",
      },
    ],
    version: 17,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateInitialValues",
      },
    ],
    version: 18,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateToNewLayout",
      },
    ],
    version: 19,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateNewlyAddedTabsWidgetsMissingData",
      },
    ],
    version: 20,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateWidgetsWithoutLeftRightColumns",
      },
      {
        moduleObj: DSLMigrations,
        functionName: "migrateOverFlowingTabsWidgets",
      },
    ],
    version: 21,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetParentRowSpaceProperty",
      },
    ],
    version: 22,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "addLogBlackListToAllListWidgetChildren",
      },
    ],
    version: 23,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetHeaderVisibilityProperties",
      },
    ],
    version: 24,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateItemsToListDataInListWidget",
      },
    ],
    version: 25,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateDatePickerMinMaxDate",
      },
    ],
    version: 26,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateFilterValueForDropDownWidget",
      },
    ],
    version: 27,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTablePrimaryColumnsComputedValue",
      },
    ],
    version: 28,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateToNewMultiSelect",
      },
    ],
    version: 29,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetDelimiterProperties",
      },
    ],
    version: 30,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateIsDisabledToButtonColumn",
      },
    ],
    version: 31,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateTableDefaultSelectedRow",
      },
    ],
    version: 32,
  },
  {
    functionLookup: [
      {
        moduleObj: menuButtonWidgetMigrations,
        functionName: "migrateMenuButtonWidgetButtonProperties",
      },
    ],
    version: 33,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateButtonWidgetValidation",
      },
    ],
    version: 34,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateInputValidation",
      },
    ],
    version: 35,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "revertTableDefaultSelectedRow",
      },
    ],
    version: 36,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableSanitizeColumnKeys",
      },
    ],
    version: 37,
  },
  {
    functionLookup: [
      {
        moduleObj: modalMigration,
        functionName: "migrateResizableModalWidgetProperties",
      },
    ],
    version: 38,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetSelectedRowBindings",
      },
    ],
    version: 39,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "revertButtonStyleToButtonColor",
      },
    ],
    version: 40,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "migrateButtonVariant",
      },
    ],
    version: 41,
  },
  {
    functionLookup: [
      {
        moduleObj: mapWidgetMigration,
        functionName: "migrateMapWidgetIsClickedMarkerCentered",
      },
    ],
    version: 42,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
        functionName: "mapAllowHorizontalScrollMigration",
      },
    ],
    version: 43,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "isSortableMigration",
      },
    ],
    version: 44,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetIconButtonVariant",
      },
    ],
    version: 45,
  },
  {
    functionLookup: [
      {
        moduleObj: checkboxMigration,
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
        moduleObj: buttonWidgetMigrations,
        functionName: "migrateRecaptchaType",
      },
    ],
    version: 48,
  },
  {
    functionLookup: [
      {
        moduleObj: DSLMigrations,
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
        moduleObj: phoneInputMigration,
        functionName: "migratePhoneInputWidgetAllowFormatting",
      },
    ],
    version: 51,
  },
  {
    functionLookup: [
      {
        moduleObj: modalMigration,
        functionName: "migrateModalIconButtonWidget",
      },
    ],
    version: 52,
  },
  {
    functionLookup: [
      {
        moduleObj: TextStyleFromTextWidget,
        functionName: "migrateScrollTruncateProperties",
      },
    ],
    version: 53,
  },
  {
    functionLookup: [
      {
        moduleObj: phoneInputMigration,
        functionName: "migratePhoneInputWidgetDefaultDialCode",
      },
    ],
    version: 54,
  },
  {
    functionLookup: [
      {
        moduleObj: inputCurrencyMigration,
        functionName: "migrateCurrencyInputWidgetDefaultCurrencyCode",
      },
    ],
    version: 55,
  },
  {
    functionLookup: [
      {
        moduleObj: radioGroupMigration,
        functionName: "migrateRadioGroupAlignmentProperty",
      },
    ],
    version: 56,
  },
  {
    functionLookup: [
      {
        moduleObj: themingMigration,
        functionName: "migrateStylingPropertiesForTheming",
      },
    ],
    version: 57,
  },
  {
    functionLookup: [
      {
        moduleObj: propertyPaneMigrations,
        functionName: "migrateCheckboxSwitchProperty",
      },
    ],
    version: 58,
  },
  {
    functionLookup: [
      {
        moduleObj: chartWidgetReskinningMigrations,
        functionName: "migrateChartWidgetReskinningData",
      },
    ],
    version: 59,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetV2Validation",
      },
    ],
    version: 60,
  },
  {
    functionLookup: [
      {
        moduleObj: chartWidgetReskinningMigrations,
        functionName: "migrateChartWidgetReskinningData",
      },
    ],
    version: 61,
  },
  {
    functionLookup: [
      {
        moduleObj: selectWidgetMigration,
        functionName: "MigrateSelectTypeWidgetDefaultValue",
      },
    ],
    version: 62,
  },
  {
    functionLookup: [
      {
        moduleObj: mapChartReskinningMigrations,
        functionName: "migrateMapChartWidgetReskinningData",
      },
    ],
    version: 63,
  },
  {
    functionLookup: [
      {
        moduleObj: rateWidgetMigrations,
        functionName: "migrateRateWidgetDisabledState",
      },
    ],
    version: 64,
  },
  {
    functionLookup: [
      {
        moduleObj: codeScannerWidgetMigrations,
        functionName: "migrateCodeScannerLayout",
      },
    ],
    version: 65,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetV2ValidationBinding",
      },
    ],
    version: 66,
  },
  {
    functionLookup: [
      {
        moduleObj: migrateLabelPosition,
        functionName: "migrateLabelPosition",
      },
    ],
    version: 67,
  },
  {
    functionLookup: [
      {
        moduleObj: migrateAutoHeight,
        functionName: "migratePropertiesForDynamicHeight",
      },
    ],
    version: 68,
  },
  {
    functionLookup: [
      {
        moduleObj: menuButtonWidgetMigrations,
        functionName: "migrateMenuButtonDynamicItems",
      },
    ],
    version: 69,
  },
  {
    functionLookup: [
      {
        moduleObj: themingMigration,
        functionName: "migrateChildStylesheetFromDynamicBindingPathList",
      },
    ],
    version: 70,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetV2SelectOption",
      },
    ],
    version: 71,
  },
  {
    functionLookup: [
      {
        moduleObj: migrateAutoHeight,
        functionName: "migrateListWidgetChildrenForAutoHeight",
      },
    ],
    version: 72,
  },
  {
    functionLookup: [
      {
        moduleObj: inputCurrencyMigration,
        functionName: "migrateInputWidgetShowStepArrows",
      },
    ],
    version: 73,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateMenuButtonDynamicItemsInsideTableWidget",
      },
    ],
    version: 74,
  },
  {
    functionLookup: [
      {
        moduleObj: migrateAutoHeight,
        functionName: "migrateInputWidgetsMultiLineInputType",
      },
    ],
    version: 75,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateColumnFreezeAttributes",
      },
    ],
    version: 76,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableSelectOptionAttributesForNewRow",
      },
    ],
    version: 77,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName:
          "migrateBindingPrefixSuffixForInlineEditValidationControl",
      },
    ],
    version: 78,
  },
  {
    functionLookup: [
      {
        moduleObj: tableMigrations,
        functionName: "migrateTableWidgetTableDataJsMode",
      },
    ],
    version: 79,
  },
  {
    functionLookup: [
      {
        moduleObj: chartMigrations,
        functionName: "migrateChartWidgetLabelOrientationStaggerOption",
      },
    ],
    version: 80,
  },
];

const mockFnObj: Record<number, any> = {};

describe("Test all the migrations are running", () => {
  afterAll(() => {
    jest.clearAllMocks();
  });
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
  DSLMigrations.transformDSL(
    originalDSLForDSLMigrations as unknown as ContainerWidgetProps<WidgetProps>,
  );

  migrations.forEach((item: any, testIdx: number) => {
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

          describe(`Test ${testIdx}:`, () => {
            test(`Has ${functionName} function executed?`, () => {
              // Check if the migration function is called
              expect(results[resultsLastIdx].value.validationFuncName).toEqual(
                functionName,
              );
            });

            // Check if the migration function is called with the current DSL version
            calls.forEach((args: any) => {
              test(`Does ${functionName} executes with DSL version: ${version}?`, () => {
                if (args[0]?.version === version) {
                  expect(args[0]?.version).toEqual(version);
                }
              });
              test(`For ${functionName}, is the ${args[0]?.version} registerd in tests?`, () => {
                expect(
                  Object.keys(mockFnObj).includes(
                    args[0]?.version.toString() ?? "0",
                  ),
                ).toBe(true);
              });
            });
          });
        }
      },
    );
  });

  test("Check the migration count matches the lates page version", () => {
    expect(migrations.length).toEqual(LATEST_PAGE_VERSION);
  });
});
