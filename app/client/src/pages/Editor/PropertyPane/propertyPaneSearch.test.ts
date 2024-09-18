import type { PropertyPaneSectionConfig } from "constants/PropertyControlConstants";
import { searchPropertyPaneConfig } from "./propertyPaneSearch";

describe("Property configuration search", () => {
  const commonProperties = {
    controlType: "CONTROL_TYPE",
    isBindProperty: false,
    isTriggerProperty: false,
  };
  const config: PropertyPaneSectionConfig[] = [
    {
      sectionName: "Section One",
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
        {
          label: "Show reset",
          propertyName: "showReset",
          ...commonProperties,
        },
        {
          label: "Visible",
          propertyName: "isVisible",
          ...commonProperties,
        },
        {
          label: "Animate loading",
          propertyName: "animateLoading",
          ...commonProperties,
        },
        {
          label: "Submit button label",
          propertyName: "submitButtonLabel",
          ...commonProperties,
        },
        {
          label: "Reset button label",
          invisible: true,
          propertyName: "resetButtonLabel",
          ...commonProperties,
        },
      ],
    },
    {
      sectionName: "Section Two",
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
    {
      sectionName: "Another Button Section",
      children: [
        {
          label: "Google reCAPTCHA key",
          propertyName: "recaptchaKey",
          ...commonProperties,
        },
      ],
    },
    {
      sectionName: "Button Section",
      children: [
        {
          label: "onClick",
          propertyName: "onClick",
          ...commonProperties,
        },
      ],
    },
    {
      sectionName: "Special Char Section",
      children: [
        {
          label: "Star *",
          propertyName: "star",
          ...commonProperties,
        },
        {
          label: "Plus +",
          propertyName: "plus",
          ...commonProperties,
        },
      ],
    },
    {
      sectionName: "Special Char (/) Section 2",
      children: [
        {
          label: "test",
          propertyName: "test",
          ...commonProperties,
        },
      ],
    },
  ];

  it("Should return configuration as it is for empty searchQuery", () => {
    const result = searchPropertyPaneConfig(config, "");

    expect(result).toEqual(config);
  });

  it("Should return empty array if the searchQuery didn't match any property or section", () => {
    const result = searchPropertyPaneConfig(config, "blablabla");

    expect(result).toEqual([]);
  });

  it("Validates search for a property", () => {
    const result = searchPropertyPaneConfig(config, "animate");

    expect(result).toEqual([
      {
        sectionName: "Section One",
        children: [
          {
            label: "Animate loading",
            propertyName: "animateLoading",
            ...commonProperties,
          },
        ],
      },
    ]);
  });

  it("Validates search for a section", () => {
    const result = searchPropertyPaneConfig(config, "Section One");

    expect(result).toEqual(config.slice(0, 1));
  });

  it("Validates search order for multiple matching items from multiple sections", () => {
    const result = searchPropertyPaneConfig(config, "button");

    expect(result).toEqual([
      {
        sectionName: "Button Section",
        children: [
          {
            label: "onClick",
            propertyName: "onClick",
            ...commonProperties,
          },
        ],
      },
      {
        sectionName: "Section Two",
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
      },
      {
        sectionName: "Another Button Section",
        children: [
          {
            label: "Google reCAPTCHA key",
            propertyName: "recaptchaKey",
            ...commonProperties,
          },
        ],
      },
      {
        sectionName: "Section One",
        children: [
          {
            label: "Submit button label",
            propertyName: "submitButtonLabel",
            ...commonProperties,
          },
        ],
      },
    ]);
  });

  it("Validates search for a nested property", () => {
    const result = searchPropertyPaneConfig(config, "placement");

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

  it("Validates search for a nested section", () => {
    const result = searchPropertyPaneConfig(config, "Icon");

    expect(result).toEqual([
      {
        sectionName: "Section Two",
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
    ]);
  });

  it("Validates search for camel Case property", () => {
    const expectedResult = [
      {
        sectionName: "Button Section",
        children: [
          {
            label: "onClick",
            propertyName: "onClick",
            ...commonProperties,
          },
        ],
      },
    ];
    let actualResult = searchPropertyPaneConfig(config, "click");

    expect(actualResult).toEqual(expectedResult);

    actualResult = searchPropertyPaneConfig(config, "onClick");
    expect(actualResult).toEqual(expectedResult);

    actualResult = searchPropertyPaneConfig(config, "on click");
    expect(actualResult).toEqual(expectedResult);
  });

  it("Validates search for camel Case property - Test 2", () => {
    const expectedResult = [
      {
        sectionName: "Another Button Section",
        children: [
          {
            label: "Google reCAPTCHA key",
            propertyName: "recaptchaKey",
            ...commonProperties,
          },
        ],
      },
    ];
    let actualResult = searchPropertyPaneConfig(config, "captcha");

    expect(actualResult).toEqual(expectedResult);

    actualResult = searchPropertyPaneConfig(config, "reCaptcha");
    expect(actualResult).toEqual(expectedResult);
  });

  it("Shouldn't search for properties with invisible flag set", () => {
    const result = searchPropertyPaneConfig(config, "Reset button label");

    expect(result).toEqual([]);
  });

  it("Validates token based match and not substring match", () => {
    // If it was string match, "valid" should've matched "Disable Invalid Forms"
    let result = searchPropertyPaneConfig(config, "valid");

    expect(result).toEqual([]);

    // If it was string match, "able" should've matched "Disable Invalid Forms"
    result = searchPropertyPaneConfig(config, "able");
    expect(result).toEqual([]);

    result = searchPropertyPaneConfig(config, "Disable Forms");
    expect(result).toEqual([]);

    const disableInvalidFormsConfig = [
      {
        sectionName: "Section One",
        children: [
          {
            label: "Disable Invalid Forms",
            propertyName: "disabledWhenInvalid",
            ...commonProperties,
          },
        ],
      },
    ];

    result = searchPropertyPaneConfig(config, "Disa");
    expect(result).toEqual(disableInvalidFormsConfig);

    result = searchPropertyPaneConfig(config, "Disable In");
    expect(result).toEqual(disableInvalidFormsConfig);

    result = searchPropertyPaneConfig(config, "Invalid For");
    expect(result).toEqual(disableInvalidFormsConfig);

    result = searchPropertyPaneConfig(config, "Invalid Forms");
    expect(result).toEqual(disableInvalidFormsConfig);
  });

  it("Ensure special characters doesn't throw errors", () => {
    expect(() => {
      searchPropertyPaneConfig(config, "*");
    }).not.toThrowError();
  });
});
