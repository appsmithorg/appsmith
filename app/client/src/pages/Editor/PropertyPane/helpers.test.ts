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
      sectionName: "Section One",
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
      sectionName: "Section Two",
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
        sectionName: "Section One",
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
  it("Validates search for a section", () => {
    const result = searchProperty(config, "Section One");
    expect(result).toEqual(config.slice(0, 1));
  });
  it("Validates search order for multiple matching items from multiple sections", () => {
    const result = searchProperty(config, "button");
    expect(result).toEqual([
      {
        sectionName: "Section Two",
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
        sectionName: "Section One",
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
    const result = searchProperty(config, "placement");
    expect(result).toEqual([
      {
        sectionName: "Section Two",
        children: [
          {
            sectionName: "Icon",
            children: [
              {
                label: "Placement",
                propertyName: "placement",
                ...commonProperties,
              },
            ],
          },
        ],
      },
    ]);
  });
});
