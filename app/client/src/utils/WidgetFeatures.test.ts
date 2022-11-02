import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { RenderModes } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import {
  DynamicHeight,
  findAndUpdatePropertyPaneControlConfig,
  hideDynamicHeightPropertyControl,
  validateMaxHeight,
  validateMinHeight,
} from "./WidgetFeatures";

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

const WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED = {
  ...DUMMY_WIDGET,
  dynamicHeight: DynamicHeight.AUTO_HEIGHT_WITH_LIMITS,
  minDynamicHeight: 4,
  maxDynamicHeight: 10,
};

const DUMMY_PROPERTY_CONTROL: PropertyPaneConfig = {
  label: "Dummy",
  propertyName: "dummy",
  controlType: "INPUT_TEXT",
  isBindProperty: false,
  isTriggerProperty: false,
};

describe("Widget Features tests", () => {
  describe("hideDynamicHeightPropertyControl", () => {
    it("Make sure hidden hook for dynamic Height disables if dynamic height is disabled", () => {
      const inputs = [
        DynamicHeight.FIXED,
        "Some other value",
        undefined,
        null,
        "hugcontents",
        "hug_contents",
      ];

      inputs.forEach((dynamicHeight) => {
        const result = hideDynamicHeightPropertyControl({
          ...DUMMY_WIDGET,
          dynamicHeight,
        });
        expect(result).toBe(true);
      });
    });
    it("Make sure hidden hook for dynamic Height disabled if dynamic height with limits is disabled", () => {
      const inputs = [DynamicHeight.AUTO_HEIGHT, "AUTO_HEIGHT"];

      inputs.forEach((dynamicHeight) => {
        const result = hideDynamicHeightPropertyControl({
          ...DUMMY_WIDGET,
          dynamicHeight,
        });
        expect(result).toBe(true);
      });
    });
    it("Make sure hidden hook for dynamic Height enabled if dynamic height with limits is enabled", () => {
      const inputs = [
        DynamicHeight.AUTO_HEIGHT_WITH_LIMITS,
        "AUTO_HEIGHT_WITH_LIMITS",
      ];

      inputs.forEach((dynamicHeight) => {
        const result = hideDynamicHeightPropertyControl({
          ...DUMMY_WIDGET,
          dynamicHeight,
        });
        expect(result).toBe(false);
      });
    });
  });

  describe("validateMinHeight", () => {
    it("should return isValid false when value is not a number", () => {
      const value = "hello";
      const { isValid } = validateMinHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(isValid).toBe(false);
    });

    it("should return messages saying `Value should be a positive integer greater than 4` when value is not a number", () => {
      const value = "hello";
      const { messages } = validateMinHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(messages).toMatchObject([
        "Value should be a positive integer greater than 4",
      ]);
    });

    it("should return parsed value as 4 when value is not a number", () => {
      const value = "hello";
      const { parsed } = validateMinHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(parsed).toBe(4);
    });

    it("should return isValid false when value is less than 4", () => {
      const value = 3;
      const { isValid } = validateMinHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(isValid).toBe(false);
    });

    it("should return messages saying `Value should be a positive integer greater than 4` when value is less than 4", () => {
      const value = 3;
      const { messages } = validateMinHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(messages).toMatchObject([
        "Value should be a positive integer greater than 4",
      ]);
    });

    it("should return parsed value as 4 when value is less than 4", () => {
      const value = 3;
      const { parsed } = validateMinHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(parsed).toBe(4);
    });

    it("should return isValid false when value is greater than maxDynamicHeight", () => {
      const maxDynamicHeight = 10;
      const value = 12;
      const { isValid } = validateMinHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        maxDynamicHeight,
      });
      expect(isValid).toBe(false);
    });

    it("should return messages saying `Value should be less than or equal Max. Height` when value is greater than maxDynamicHeight", () => {
      const maxDynamicHeight = 10;
      const value = 12;
      const { messages } = validateMinHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        maxDynamicHeight,
      });
      expect(messages).toMatchObject([
        "Value should be less than or equal Max. Height",
      ]);
    });

    it("should return parsed value as maxDynamicHeight when value is greater than maxDynamicHeight", () => {
      const maxDynamicHeight = 10;
      const value = 12;
      const { parsed } = validateMinHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        maxDynamicHeight,
      });
      expect(parsed).toBe(maxDynamicHeight);
    });

    it("should return isValid true when value is a valid number and less than maxDynamicHeight", () => {
      const maxDynamicHeight = 10;
      const value = 8;
      const { isValid } = validateMinHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        maxDynamicHeight,
      });
      expect(isValid).toBe(true);
    });

    it("should return isValid true when value is a valid number and equal to maxDynamicHeight", () => {
      const maxDynamicHeight = 10;
      const value = 10;
      const { isValid } = validateMinHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        maxDynamicHeight,
      });
      expect(isValid).toBe(true);
    });

    it("should return messages as empty when value is a valid number and less than maxDynamicHeight", () => {
      const maxDynamicHeight = 10;
      const value = 8;
      const { messages } = validateMinHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        maxDynamicHeight,
      });
      expect(messages).toMatchObject([]);
    });

    it("should return parsed value as value when value is a valid number and less than maxDynamicHeight", () => {
      const maxDynamicHeight = 10;
      const value = 8;
      const { parsed } = validateMinHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        maxDynamicHeight,
      });
      expect(parsed).toBe(value);
    });
  });

  describe("validateMaxHeight", () => {
    it("should return isValid false when value is not a number", () => {
      const value = "hello";
      const { isValid } = validateMaxHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(isValid).toBe(false);
    });

    it("should return messages saying `Value should be a positive integer greater than 4` when value is not a number", () => {
      const value = "hello";
      const { messages } = validateMaxHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(messages).toMatchObject([
        "Value should be a positive integer greater than 4",
      ]);
    });

    it("should return parsed value as 100 when value is not a number", () => {
      const value = "hello";
      const { parsed } = validateMaxHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(parsed).toBe(100);
    });

    it("should return isValid false when value is less than 4", () => {
      const value = 3;
      const { isValid } = validateMaxHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(isValid).toBe(false);
    });

    it("should return messages saying `Value should be a positive integer greater than 4` when value is less than 4", () => {
      const value = 3;
      const { messages } = validateMaxHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(messages).toMatchObject([
        "Value should be a positive integer greater than 4",
      ]);
    });

    it("should return parsed value as 100 when value is less than 4", () => {
      const value = 3;
      const { parsed } = validateMaxHeight(
        value,
        WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
      );
      expect(parsed).toBe(100);
    });

    it("should return isValid false when value is less than minDynamicHeight", () => {
      const minDynamicHeight = 10;
      const value = 8;
      const { isValid } = validateMaxHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        minDynamicHeight,
      });
      expect(isValid).toBe(false);
    });

    it("should return messages saying `Value should be greater than or equal Min. Height` when value is less than minDynamicHeight", () => {
      const minDynamicHeight = 10;
      const value = 8;
      const { messages } = validateMaxHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        minDynamicHeight,
      });
      expect(messages).toMatchObject([
        "Value should be greater than or equal Min. Height",
      ]);
    });

    it("should return parsed value as minDynamicHeight when value is less than minDynamicHeight", () => {
      const minDynamicHeight = 10;
      const value = 8;
      const { parsed } = validateMaxHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        minDynamicHeight,
      });
      expect(parsed).toBe(minDynamicHeight);
    });

    it("should return isValid true when value is a valid number and greater than minDynamicHeight", () => {
      const minDynamicHeight = 10;
      const value = 12;
      const { isValid } = validateMaxHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        minDynamicHeight,
      });
      expect(isValid).toBe(true);
    });

    it("should return isValid true when value is a valid number and equal to minDynamicHeight", () => {
      const minDynamicHeight = 10;
      const value = 10;
      const { isValid } = validateMaxHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        minDynamicHeight,
      });
      expect(isValid).toBe(true);
    });

    it("should return messages as empty when value is a valid number and greater than minDynamicHeight", () => {
      const minDynamicHeight = 10;
      const value = 12;
      const { messages } = validateMaxHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        minDynamicHeight,
      });
      expect(messages).toMatchObject([]);
    });

    it("should return parsed value as value when value is a valid number and greater than minDynamicHeight", () => {
      const minDynamicHeight = 10;
      const value = 12;
      const { parsed } = validateMaxHeight(value, {
        ...WIDGET_WITH_AUTO_HEIGHT_WITH_LIMITS_ENABLED,
        minDynamicHeight,
      });
      expect(parsed).toBe(value);
    });
  });

  describe("findAndUpdatePropertyPaneControlConfig", () => {
    it("should add a new property in the config", () => {
      const config = [
        {
          sectionName: "General",
          children: [DUMMY_PROPERTY_CONTROL],
        },
      ];

      const updates = findAndUpdatePropertyPaneControlConfig(config, {
        dummy: {
          someNewProperty: "someNewPropertyValue",
        },
      });

      const expected = [
        {
          sectionName: "General",
          children: [
            {
              ...DUMMY_PROPERTY_CONTROL,
              someNewProperty: "someNewPropertyValue",
            },
          ],
        },
      ];

      expect(updates).toMatchObject(expected);
    });

    it("should update a new property in the config", () => {
      const config = [
        {
          sectionName: "General",
          children: [DUMMY_PROPERTY_CONTROL],
        },
      ];

      const updates = findAndUpdatePropertyPaneControlConfig(config, {
        dummy: {
          controlType: "SWITCH",
        },
      });

      const expected = [
        {
          sectionName: "General",
          children: [
            {
              ...DUMMY_PROPERTY_CONTROL,
              controlType: "SWITCH",
            },
          ],
        },
      ];

      expect(updates).toMatchObject(expected);
    });
  });
});
