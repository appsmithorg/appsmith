import type { PropertyPaneSectionConfig } from "constants/PropertyControlConstants";
import { shouldSectionBeExpanded } from "./PropertyControlsGenerator";

describe("Property Controls Generator", () => {
  const commonProperties = {
    controlType: "CONTROL_TYPE",
    isBindProperty: false,
    isTriggerProperty: false,
  };
  const config: PropertyPaneSectionConfig[] = [
    {
      sectionName: "Data",
      children: [
        {
          label: "Disable Invalid Forms",
          propertyName: "disabledWhenInvalid",
          ...commonProperties,
        },
        {
          label: "Scroll contents",
          propertyName: "scrollContents",
          ...commonProperties,
        },
      ],
      expandedByDefault: true,
    },
    {
      sectionName: "General",
      children: [
        {
          label: "Button color",
          propertyName: "buttonColor",
          ...commonProperties,
        },
        {
          label: "Button variant",
          propertyName: "buttonVariant",
          ...commonProperties,
        },
      ],
      expandedByDefault: false,
    },
  ];

  // When feature flag is enabled, it should check for expandedByDefault property of section config
  it("Should return true when section has expandedByDefault property set to true", () => {
    const result = shouldSectionBeExpanded(config[0], true);

    expect(result).toEqual(true);
  });

  it("Should return false when section has expandedByDefault property set to false", () => {
    const result = shouldSectionBeExpanded(config[1], true);

    expect(result).toEqual(false);
  });

  // Following tests check for a case where feature flag is disabled, it should always expand the sections
  it("Should return true as the flag is set to false, even though expandedByDefault is true", () => {
    const result = shouldSectionBeExpanded(config[0], false);

    expect(result).toEqual(true);
  });

  it("Should return true as the flag is set to false, even though expandedByDefault is false", () => {
    const result = shouldSectionBeExpanded(config[1], false);

    expect(result).toEqual(true);
  });

  it("Should return true when feature flag is enabled and expandedByDefault property is missing", () => {
    const configWithoutExpandedByDefault: PropertyPaneSectionConfig = {
      sectionName: "Styling",
      children: [
        {
          label: "Background Color",
          propertyName: "backgroundColor",
          controlType: "CONTROL_TYPE",
          isBindProperty: false,
          isTriggerProperty: false,
        },
      ],
    };
    const result = shouldSectionBeExpanded(
      configWithoutExpandedByDefault,
      true,
    );

    expect(result).toEqual(true);
  });
});
