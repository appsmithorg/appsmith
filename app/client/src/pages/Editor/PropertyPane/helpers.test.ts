import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { searchProperty } from "./helpers";

describe("Property configuration search", () => {
  const commonProperties = {
    controlType: "CONTROL_TYPE",
    isBindProperty: false,
    isTriggerProperty: false,
  };
  const config: PropertyPaneConfig[] = [
    {
      sectionName: "A",
      children: [
        {
          label: "Disable Invalid Forms",
          propertyName: "disabledWhenInvalid",
          ...commonProperties,
        },
        {
          label: "Scroll Contents",
          propertyName: "scrollContents",
          ...commonProperties,
        },
        {
          label: "Show Reset",
          propertyName: "showReset",
          ...commonProperties,
        },
        {
          label: "Visible",
          propertyName: "isVisible",
          ...commonProperties,
        },
        {
          label: "Animate Loading",
          propertyName: "animateLoading",
          ...commonProperties,
        },
        {
          label: "Submit Button Label",
          propertyName: "submitButtonLabel",
          ...commonProperties,
        },
        {
          label: "Reset Button Label",
          propertyName: "resetButtonLabel",
          ...commonProperties,
        },
      ],
    },
    {
      sectionName: "B",
      children: [
        {
          label: "Button Color",
          propertyName: "buttonColor",
          ...commonProperties,
        },
        {
          label: "Button Variant",
          propertyName: "buttonVariant",
          ...commonProperties,
        },
        {
          sectionName: "Icon",
          children: [
            {
              label: "Icon",
              propertyName: "icon",
              ...commonProperties,
            },
            {
              label: "Placement",
              propertyName: "placement",
              ...commonProperties,
            },
            {
              label: "Icon Align",
              propertyName: "iconAlign",
              ...commonProperties,
            },
          ],
        },
      ],
    },
  ];

  it("Should return configuration as it is for empty searchQuery", () => {
    const result = searchProperty(config, "");
    expect(result).toEqual(config);
  });

  it("Validates search for one item", () => {
    const result = searchProperty(config, "animate");
    expect(result).toEqual([
      {
        sectionName: "A",
        children: [
          {
            label: "Animate Loading",
            propertyName: "animateLoading",
            ...commonProperties,
          },
        ],
      },
    ]);
  });

  it("Validates search order for multiple matching items", () => {
    let result = searchProperty(config, "visible");
    expect(result).toEqual([
      {
        sectionName: "A",
        children: [
          {
            label: "Visible",
            propertyName: "isVisible",
            ...commonProperties,
          },
          {
            label: "Disable Invalid Forms",
            propertyName: "disabledWhenInvalid",
            ...commonProperties,
          },
        ],
      },
    ]);

    result = searchProperty(config, "disable");
    expect(result).toEqual([
      {
        sectionName: "A",
        children: [
          {
            label: "Disable Invalid Forms",
            propertyName: "disabledWhenInvalid",
            ...commonProperties,
          },
          {
            label: "Visible",
            propertyName: "isVisible",
            ...commonProperties,
          },
        ],
      },
    ]);
  });

  it("Validates search order for multiple matching items from multiple sections", () => {
    const result = searchProperty(config, "button");
    expect(result).toEqual([
      {
        sectionName: "B",
        children: [
          {
            label: "Button Color",
            propertyName: "buttonColor",
            ...commonProperties,
          },
          {
            label: "Button Variant",
            propertyName: "buttonVariant",
            ...commonProperties,
          },
        ],
      },
      {
        sectionName: "A",
        children: [
          {
            label: "Reset Button Label",
            propertyName: "resetButtonLabel",
            ...commonProperties,
          },
          {
            label: "Submit Button Label",
            propertyName: "submitButtonLabel",
            ...commonProperties,
          },
        ],
      },
    ]);
  });

  it("Validates search order for deeply nested items", () => {
    const result = searchProperty(config, "icon");
    expect(result).toEqual([
      {
        sectionName: "B",
        children: [
          {
            sectionName: "Icon",
            children: [
              {
                label: "Icon",
                propertyName: "icon",
                ...commonProperties,
              },
              {
                label: "Icon Align",
                propertyName: "iconAlign",
                ...commonProperties,
              },
            ],
          },
        ],
      },
    ]);
  });
});
