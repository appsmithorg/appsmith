import generatePanelPropertyConfig from "./propertyConfig/generatePanelPropertyConfig";

describe(".generatePanelPropertyConfig", () => {
  it("ACTION_SELECTOR control field should not have customJSControl and have additionalAutoComplete", (done) => {
    const panelConfig = generatePanelPropertyConfig(1);

    panelConfig?.children.forEach((section) => {
      if ("sectionName" in section) {
        section.children?.forEach((property) => {
          if ("propertyName" in property) {
            // If property is an event/action
            if (property.controlType === "ACTION_SELECTOR") {
              if (property.customJSControl) {
                done.fail(
                  `${section.sectionName} - ${property.propertyName} should not define "customJSControl" property`,
                );
              }

              if (!property.additionalAutoComplete) {
                done.fail(
                  `${section.sectionName} - ${property.propertyName} should define "additionalAutoComplete" property. Use getAutocompleteProperties`,
                );
              }
            }
          }
        });
      }
    });

    done();
  });
});
