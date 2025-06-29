import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import type { PropertyUpdates } from "WidgetProvider/types";
import {
  RenderModes,
  TextSizes,
  WidgetHeightLimits,
} from "constants/WidgetConstants";
import { remove } from "lodash";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import type { WidgetProps } from "./BaseWidget";
import { rgbaMigrationConstantV56 } from "../WidgetProvider/constants";
import {
  borderRadiusUtility,
  replaceRgbaMigrationConstant,
  boxShadowMigration,
  boxShadowUtility,
  fontSizeUtility,
  lightenColor,
  composePropertyUpdateHook,
  sanitizeKey,
  shouldUpdateWidgetHeightAutomatically,
  isAutoHeightEnabledForWidget,
  isAutoHeightEnabledForWidgetWithLimits,
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isCompactMode,
} from "./WidgetUtils";
import {
  getCustomTextColor,
  getCustomBackgroundColor,
  getCustomHoverColor,
} from "./WidgetUtils";

const tableWidgetProps = {
  dynamicBindingPathList: [
    {
      key: "primaryColumns.action.boxShadowColor",
    },
  ],
  primaryColumns: {
    action: {
      boxShadow: "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
      boxShadowColor: ["red", "red", "red"],
    },
  },
};

describe("validate widget utils button style functions", () => {
  const theme = getTheme(ThemeMode.LIGHT);

  // validate getCustomTextColor function
  it("getCustomTextColor - validate empty or undefined background color", () => {
    // background color is undefined
    const result = getCustomTextColor(theme);

    expect(result).toStrictEqual("#FFFFFF");

    // background color is empty string
    const backgroundColor = "";
    const expected = "#FFFFFF";
    const result2 = getCustomTextColor(theme, backgroundColor);

    expect(result2).toStrictEqual(expected);
  });

  it("getCustomTextColor - validate text color in case of dark or light background color", () => {
    // background color is dark
    const blueBackground = "#3366FF";
    const expected1 = "#FFFFFF";
    const result1 = getCustomTextColor(theme, blueBackground);

    expect(result1).toStrictEqual(expected1);

    // background color is light
    const yellowBackground = "#FFC13D";
    const expected2 = "#FFFFFF";
    const result2 = getCustomTextColor(theme, yellowBackground);

    expect(result2).toStrictEqual(expected2);
  });

  // validate getCustomBackgroundColor function
  it("getCustomBackgroundColor - validate empty or undefined background color", () => {
    const expected = "none";
    const result = getCustomBackgroundColor();

    expect(result).toStrictEqual(expected);
  });

  it("getCustomBackgroundColor - validate background color with primary button variant", () => {
    const backgroundColor = "#03b365";
    const expected = "#03b365";
    const result = getCustomBackgroundColor(
      ButtonVariantTypes.PRIMARY,
      backgroundColor,
    );

    expect(result).toStrictEqual(expected);
  });

  it("getCustomBackgroundColor - validate background color with secondary button variant", () => {
    const backgroundColor = "#03b365";
    const expected = "none";
    const result = getCustomBackgroundColor(
      ButtonVariantTypes.SECONDARY,
      backgroundColor,
    );

    expect(result).toStrictEqual(expected);
  });

  // validate getCustomHoverColor function
  it("getCustomHoverColor - validate empty or undefined background color or variant", () => {
    // background color and variant is both are undefined
    const expected = "hsl(0, 0%, 95%)";
    const result = getCustomHoverColor(theme);

    expect(result).toStrictEqual(expected);

    // variant is undefined
    const backgroundColor = "#03b365";
    const expected1 = "hsl(153, 97%, 31%)";
    const result1 = getCustomHoverColor(theme, undefined, backgroundColor);

    expect(result1).toStrictEqual(expected1);
  });

  // validate getCustomHoverColor function
  it("getCustomHoverColor - validate hover color for different variant", () => {
    const backgroundColor = "hsl(153, 97% ,36%)";
    // variant : PRIMARY
    const expected1 = "hsl(153, 97%, 31%)";
    const result1 = getCustomHoverColor(
      theme,
      ButtonVariantTypes.PRIMARY,
      backgroundColor,
    );

    expect(result1).toStrictEqual(expected1);

    // variant : PRIMARY without background
    const expected2 = "hsl(0, 0%, 95%)";
    const result2 = getCustomHoverColor(theme, ButtonVariantTypes.PRIMARY);

    expect(result2).toStrictEqual(expected2);

    // variant : SECONDARY
    const expected3 = "rgba(3, 181, 101, 0.1)";
    const result3 = getCustomHoverColor(
      theme,
      ButtonVariantTypes.SECONDARY,
      backgroundColor,
    );

    expect(result3).toStrictEqual(expected3);

    // variant : SECONDARY without background
    const expected4 = "rgba(255, 255, 255, 0.1)";
    const result4 = getCustomHoverColor(theme, ButtonVariantTypes.SECONDARY);

    expect(result4).toStrictEqual(expected4);

    // variant : TERTIARY
    const expected5 = "rgba(3, 181, 101, 0.1)";
    const result5 = getCustomHoverColor(
      theme,
      ButtonVariantTypes.TERTIARY,
      backgroundColor,
    );

    expect(result5).toStrictEqual(expected5);

    // variant : TERTIARY without background
    const expected6 = "rgba(255, 255, 255, 0.1)";
    const result6 = getCustomHoverColor(theme, ButtonVariantTypes.TERTIARY);

    expect(result6).toStrictEqual(expected6);
  });

  it("Check if the color is lightened with lightenColor utility", () => {
    /**
     * Colors with :
     *   0% brightness = #000000,
     * > 40% brightness = #696969
     * > 50% brightness = #8a8a8a
     * > 60% brightness = #b0b0b0
     * > 70% brightness = #d6d4d4
     */

    const actualColors = [
      "#000000",
      "#696969",
      "#8a8a8a",
      "#b0b0b0",
      "#d6d4d4",
    ];
    const lightColors = ["#ededed", "#ededed", "#ededed", "#ededed", "#eeeded"];

    actualColors.forEach((color, idx) => {
      expect(lightenColor(color)).toEqual(lightColors[idx]);
    });
  });
});

describe(".sanitizeKey", () => {
  it("returns sanitized value when passed a valid string", () => {
    const inputAndExpectedOutput = [
      ["lowercase", "lowercase"],
      ["__abc__", "__abc__"],
      ["lower_snake_case", "lower_snake_case"],
      ["UPPER_SNAKE_CASE", "UPPER_SNAKE_CASE"],
      ["PascalCase", "PascalCase"],
      ["camelCase", "camelCase"],
      ["lower-kebab-case", "lower_kebab_case"],
      ["UPPER_KEBAB-CASE", "UPPER_KEBAB_CASE"],
      ["Sentencecase", "Sentencecase"],
      ["", "_"],
      ["with space", "with_space"],
      ["with multiple  spaces", "with_multiple__spaces"],
      ["with%special)characters", "with_special_characters"],
      ["with%$multiple_spl.)characters", "with__multiple_spl__characters"],
      ["1startingWithNumber", "_1startingWithNumber"],
    ];

    inputAndExpectedOutput.forEach(([input, expectedOutput]) => {
      const result = sanitizeKey(input);

      expect(result).toEqual(expectedOutput);
    });
  });

  it("returns sanitized value when valid string with existing keys and reserved keys", () => {
    const existingKeys = [
      "__id",
      "__restricted__",
      "firstName1",
      "_1age",
      "gender",
      "poll123",
      "poll124",
      "poll125",
      "address_",
    ];

    const inputAndExpectedOutput = [
      ["lowercase", "lowercase"],
      ["__abc__", "__abc__"],
      ["lower_snake_case", "lower_snake_case"],
      ["UPPER_SNAKE_CASE", "UPPER_SNAKE_CASE"],
      ["PascalCase", "PascalCase"],
      ["camelCase", "camelCase"],
      ["lower-kebab-case", "lower_kebab_case"],
      ["UPPER_KEBAB-CASE", "UPPER_KEBAB_CASE"],
      ["Sentencecase", "Sentencecase"],
      ["", "_"],
      ["with space", "with_space"],
      ["with multiple  spaces", "with_multiple__spaces"],
      ["with%special)characters", "with_special_characters"],
      ["with%$multiple_spl.)characters", "with__multiple_spl__characters"],
      ["1startingWithNumber", "_1startingWithNumber"],
      ["1startingWithNumber", "_1startingWithNumber"],
      ["firstName", "firstName"],
      ["firstName1", "firstName2"],
      ["1age", "_1age1"],
      ["address&", "address_1"],
      ["%&id", "__id1"],
      ["%&restricted*(", "__restricted__1"],
      ["poll130", "poll130"],
      ["poll124", "poll126"],
      ["हिन्दि", "xn__j2bd4cyac6f"],
      ["😃", "xn__h28h"],
    ];

    inputAndExpectedOutput.forEach(([input, expectedOutput]) => {
      const result = sanitizeKey(input, {
        existingKeys,
      });

      expect(result).toEqual(expectedOutput);
    });
  });
});

describe("Test widget utility functions", () => {
  it("case: fontSizeUtility returns the font sizes based on variant", () => {
    const expectedFontSize = "0.75rem";

    expect(fontSizeUtility(TextSizes.PARAGRAPH2)).toEqual(expectedFontSize);
  });

  it("case: borderRadiusUtility returns the borderRadius based on borderRadius variant", () => {
    const expectedBorderRadius = "0.375rem";

    expect(borderRadiusUtility(ButtonBorderRadiusTypes.ROUNDED)).toEqual(
      expectedBorderRadius,
    );
  });

  it("case: replaceRgbaMigrationConstant returns the new boxShadow by replacing default boxShadowColor with new boxShadowColor", () => {
    const boxShadow = "0px 0px 4px 3px rgba(0, 0, 0, 0.25)";
    const boxShadowColor = "red";
    const expectedBoxShadow = "0px 0px 4px 3px red";

    expect(replaceRgbaMigrationConstant(boxShadow, boxShadowColor)).toEqual(
      expectedBoxShadow,
    );
  });

  it("case: boxShadowUtility returns the new boxShadow", () => {
    const variants = [
      "VARIANT1",
      "VARIANT2",
      "VARIANT3",
      "VARIANT4",
      "VARIANT5",
    ];
    let newBoxShadowColor = rgbaMigrationConstantV56;
    let expectedBoxShadows = [
      `0px 0px 4px 3px ${newBoxShadowColor}`,
      `3px 3px 4px ${newBoxShadowColor}`,
      `0px 1px 3px ${newBoxShadowColor}`,
      `2px 2px 0px  ${newBoxShadowColor}`,
      `-2px -2px 0px ${newBoxShadowColor}`,
    ];

    // Check the boxShadow when the boxShadowColor is set to default;
    variants.forEach((value: string, index: number) => {
      expect(boxShadowUtility(value, newBoxShadowColor)).toEqual(
        expectedBoxShadows[index],
      );
    });

    // Check the boxShadow when the boxShadowColor is set to custom color;
    newBoxShadowColor = "red";
    expectedBoxShadows = [
      `0px 0px 4px 3px ${newBoxShadowColor}`,
      `3px 3px 4px ${newBoxShadowColor}`,
      `0px 1px 3px ${newBoxShadowColor}`,
      `2px 2px 0px  ${newBoxShadowColor}`,
      `-2px -2px 0px ${newBoxShadowColor}`,
    ];
    variants.forEach((value: string, index: number) => {
      expect(boxShadowUtility(value, newBoxShadowColor)).toEqual(
        expectedBoxShadows[index],
      );
    });
  });

  it("case: boxShadowMigration returns correct boxShadow whenever boxShadow and boxShadowColor ar dynamic", () => {
    /**
     * Function usd inside table widget cell properties for Icon and menu button types.
     * This function is used to run theming migration boxShadow and boxShadowColor has dynamic bindings
     * Function runs for the following scenarios, when:
     * 1. boxShadow: Static; boxShadowColor: Dynamic
     * 2. boxShadow: Dynamic; boxShadowColor: Static
     * 3. boxShadow: Dynamic; boxShadowColor: empty
     * 4. boxShadow: Dynamic; boxShadowColor: dynamic
     */

    // Case 1:
    expect(
      boxShadowMigration(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tableWidgetProps.dynamicBindingPathList as any,
        "action",
        "0px 0px 4px 3px rgba(0, 0, 0, 0.25)",
        "red",
      ),
    ).toEqual("0px 0px 4px 3px red");

    // Case 2 & 3:
    // Make boxShadow dynamic
    /**
     * 1. Add the boxShadow to the DBPL
     * 2. Remove boxShadowColor from the DBPL
     * 3. Assign the action.boxShadowcolor as a static value.
     * 4. Assign the action.boxShadowcolor as a empty value.
     */
    tableWidgetProps.dynamicBindingPathList.push({
      key: "primaryColumns.action.boxShadow",
    });
    // Remove boxShadowColor from dynamicBindingPathList
    remove(
      tableWidgetProps.dynamicBindingPathList,
      (value: { key: string }) =>
        value.key === "primaryColumns.action.boxShadowColor",
    );
    // Assign values to boxShadow and boxShadowColor
    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableWidgetProps.primaryColumns.action.boxShadowColor = "blue" as any;
    let newBoxShadow = boxShadowMigration(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tableWidgetProps.dynamicBindingPathList as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor,
    );

    expect(newBoxShadow).toEqual("0px 0px 4px 3px blue");

    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableWidgetProps.primaryColumns.action.boxShadowColor = "" as any; // Add empty boxShadowColor.

    newBoxShadow = boxShadowMigration(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tableWidgetProps.dynamicBindingPathList as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor,
    );
    expect(newBoxShadow).toEqual("0px 0px 4px 3px rgba(0, 0, 0, 0.25)");

    // Case 4:
    // Add boxShadow and boxShadowColor to the dynamicBindingPathList
    tableWidgetProps.dynamicBindingPathList = [
      ...tableWidgetProps.dynamicBindingPathList,
      {
        key: "primaryColumns.action.boxShadow",
      },
      {
        key: "primaryColumns.action.boxShadowColor",
      },
    ];

    // Assign values to boxShadow and boxShadowColor
    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    tableWidgetProps.primaryColumns.action.boxShadowColor = [
      "orange",
      "orange",
      "orange",
    ];
    newBoxShadow = boxShadowMigration(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tableWidgetProps.dynamicBindingPathList as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor[0],
    );
    expect(newBoxShadow).toEqual("0px 0px 4px 3px orange");

    tableWidgetProps.primaryColumns.action.boxShadow = "VARIANT1";
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableWidgetProps.primaryColumns.action.boxShadowColor = ["", "", ""] as any; // Add empty boxShadowColor when dynamic

    // Add empty boxShadowColor.
    newBoxShadow = boxShadowMigration(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tableWidgetProps.dynamicBindingPathList as any,
      "action",
      tableWidgetProps.primaryColumns.action.boxShadow,
      tableWidgetProps.primaryColumns.action.boxShadowColor[0],
    );
    expect(newBoxShadow).toEqual("0px 0px 4px 3px rgba(0, 0, 0, 0.25)");
  });
});

type composePropertyUpdateHookInputType = Array<
  (
    props: unknown,
    propertyPath: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyValue: any,
  ) => PropertyUpdates[] | undefined
>;
describe("composePropertyUpdateHook", () => {
  it("should test that it's returning a function", () => {
    expect(typeof composePropertyUpdateHook([() => undefined])).toEqual(
      "function",
    );
  });

  it("should test that calling the function concats the returned values of input functions in the given order", () => {
    const input = [() => [1], () => [2], () => [3], () => [4]];

    const expected = [1, 2, 3, 4];

    expect(
      composePropertyUpdateHook(
        input as unknown as composePropertyUpdateHookInputType,
      )(null, "", null),
    ).toEqual(expected);
  });

  it("should test that calling the function concats the returned values of input functions in the given order and ignores undefined", () => {
    const input = [() => [1], () => undefined, () => [3], () => [4]];

    const expected = [1, 3, 4];

    expect(
      composePropertyUpdateHook(
        input as unknown as composePropertyUpdateHookInputType,
      )(null, "", null),
    ).toEqual(expected);
  });

  it("should test that calling the function without any function returns undefined", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input: any = [];

    const expected = undefined;

    expect(composePropertyUpdateHook(input)(null, "", null)).toEqual(expected);
  });
});

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  version: 2,
  widgetId: "",
  widgetName: "",
};

describe("Auto Height Utils", () => {
  it("should return true if withLimits is true and widget has AUTO_HEIGHT_WITH_LIMITS", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
    };

    const result = isAutoHeightEnabledForWidgetWithLimits(props);

    expect(result).toBe(true);
  });
  it("should return false if withLimits is true and widget has AUTO_HEIGHT", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT",
    };

    const result = isAutoHeightEnabledForWidgetWithLimits(props);

    expect(result).toBe(false);
  });
  it("should return true if withLimits is false and widget has AUTO_HEIGHT", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT",
    };

    const result = isAutoHeightEnabledForWidget(props);

    expect(result).toBe(true);
  });

  it("should return false withLimits is false and widget has FIXED", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "FIXED",
    };

    const result = isAutoHeightEnabledForWidget(props);

    expect(result).toBe(false);
  });
  it("should return false withLimits is true and widget has FIXED", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "FIXED",
    };

    const result = isAutoHeightEnabledForWidgetWithLimits(props);

    expect(result).toBe(false);
  });
  it("should return 9000 if widget has AUTO_HEIGHT", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT",
      maxDynamicHeight: 20,
    };

    const result = getWidgetMaxAutoHeight(props);

    expect(result).toBe(WidgetHeightLimits.MAX_HEIGHT_IN_ROWS);
  });
  it("should return 20 if widget has AUTO_HEIGHT_WITH_LIMITS", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      maxDynamicHeight: 20,
    };

    const result = getWidgetMaxAutoHeight(props);

    expect(result).toBe(20);
  });
  it("should return 9000 if widget has AUTO_HEIGHT_WITH_LIMITS and maxDynamicHeight is undefined", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      maxDynamicHeight: undefined,
    };

    const result = getWidgetMaxAutoHeight(props);

    expect(result).toBe(WidgetHeightLimits.MAX_HEIGHT_IN_ROWS);
  });

  it("should return undefined if widget is FIXED ", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "FIXED",
      maxDynamicHeight: undefined,
    };

    const result = getWidgetMaxAutoHeight(props);

    expect(result).toBeUndefined();
  });

  it("should return 20 if widget has AUTO_HEIGHT and props has 20", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT",
      minDynamicHeight: 20,
    };

    const result = getWidgetMinAutoHeight(props);

    expect(result).toBe(20);
  });
  it("should return 20 if widget has AUTO_HEIGHT_WITH_LIMITS", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      minDynamicHeight: 20,
    };

    const result = getWidgetMinAutoHeight(props);

    expect(result).toBe(20);
  });
  it("should return 4 if widget has AUTO_HEIGHT_WITH_LIMITS and minDynamicHeight is undefined", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      minDynamicHeight: undefined,
    };

    const result = getWidgetMinAutoHeight(props);

    expect(result).toBe(WidgetHeightLimits.MIN_HEIGHT_IN_ROWS);
  });

  it("should return undefined if widget is FIXED ", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "FIXED",
      minDynamicHeight: undefined,
    };

    const result = getWidgetMinAutoHeight(props);

    expect(result).toBeUndefined();
  });
});

describe("Should Update Widget Height Automatically?", () => {
  it("Multiple scenario tests", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      minDynamicHeight: 19,
      maxDynamicHeight: 40,
      topRow: 20,
      bottomRow: 40,
    };

    const inputs = [
      600, // Is beyond max height of 40 rows,
      560, // Is beyond max height of 40 rows
      220, // Is within 20 and 40 rows limits
      180, // Is below the min of 20 rows
      200, // Is the same as current height
      190, // Is exactly min value
      400, // Is exactly max value
      0, // Is below the min possible value
      100, // Is below the min possible value
    ];
    const expected = [
      true, // because currentHeight is not close to maxDynamicHeight
      true, // because currentheight is not close to maxDynamicHeight
      true,
      true, // because we need to go as low as possible (minDynamicHeight)
      true,
      true,
      true,
      true, // because we need to go as low as possible (minDynamicHeight)
      true, // because we need to go as low as possible (minDynamicHeight)
    ];

    inputs.forEach((input, index) => {
      const result = shouldUpdateWidgetHeightAutomatically(input, props);

      expect(result).toStrictEqual(expected[index]);
    });
  });
  it("When height is below min rows, should update, no matter the expectations", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      minDynamicHeight: 19,
      maxDynamicHeight: 40,
      topRow: 20,
      bottomRow: 25,
    };

    const input = 0;
    const expected = true;

    const result = shouldUpdateWidgetHeightAutomatically(input, props);

    expect(result).toStrictEqual(expected);
  });
  it("When height is above max rows, should update, no matter the expectations", () => {
    const props = {
      ...DUMMY_WIDGET,
      dynamicHeight: "AUTO_HEIGHT_WITH_LIMITS",
      minDynamicHeight: 19,
      maxDynamicHeight: 40,
      topRow: 20,
      bottomRow: 65,
    };

    const input = 0;
    const expected = true;

    const result = shouldUpdateWidgetHeightAutomatically(input, props);

    expect(result).toStrictEqual(expected);
  });
  it("should return correct value for isCompactMode", () => {
    const compactHeight = 40;
    const unCompactHeight = 41;

    expect(isCompactMode(compactHeight)).toBeTruthy();
    expect(isCompactMode(unCompactHeight)).toBeFalsy();
  });
});
