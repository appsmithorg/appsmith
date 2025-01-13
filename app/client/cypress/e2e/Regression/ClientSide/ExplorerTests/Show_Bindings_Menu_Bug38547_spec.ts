import commonLocators from "../../../../locators/commonlocators.json";
import {
  agHelper,
  apiPage,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EditorViewMode,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";
import apiWidgetLocator from "../../../../locators/apiWidgetslocator.json";

describe(
  // https://github.com/appsmithorg/appsmith/issues/38547
  "Validate if Show Bindings menu shows up in split pane mode for queries & JS Objects",
  { tags: ["@tag.IDE", "@tag.JS"] },
  () => {
    // Utility function to validate the bindings list against expected bindings
    const validateBindings = (bindingsList, expectedBindings) => {
      // Assert that the number of bindings matches the expected count
      expect(bindingsList).to.have.length(expectedBindings.length);
      expectedBindings.forEach((binding, index) => {
        const element = bindingsList.eq(index); // Get the binding element by index
        expect(element).to.contain(binding); // Assert the binding content matches the expected value
      });
    };

    it("1. Validate 'Show bindings' gets displayed for JS Objects in split pane view", () => {
      jsEditor.CreateJSObject("", { prettify: false, toRun: false });

      // Switch to split view
      EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);

      // Switch to list view
      cy.get(commonLocators.listToggle).click();
      PageLeftPane.assertPresence("JSObject1");
      agHelper.GetNClick(jsEditor._jsPageActions, 0, true);
      cy.contains("Show bindings").click();

      // Assert that the bindings menu is visible
      cy.xpath(commonLocators.showBindingsMenu).should("be.visible");

      /*
      // There is a bug in which the order of bindings is incorrectly shown for JS Objects. Will enable the below validation once that is fixed.
      // Expected bindings for the JavaScript Object
      const expectedJSBindings = [
        "{{JSObject1.myVar1}}",
        "{{JSObject1.myVar2}}",
        "{{JSObject1.myFun1()}}",
        "{{JSObject1.myFun1.data}}",
        "{{JSObject1.myFun2()}}",
        "{{JSObject1.myFun2.data}}",
      ];

      // Validate that the bindings in the menu match the expected bindings
      cy.get(jsEditor._propertyList).then(($lis) => {
        validateBindings($lis, expectedJSBindings);
      });
      */
    });

    it("2. Validate 'Show bindings' gets displayed for queries in split pane view", () => {
      // Switch to standard view
      EditorNavigation.SwitchScreenMode(EditorViewMode.FullScreen);
      apiPage.CreateAndFillApi("www.google.com");

      // Switch back to split view
      EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);

      // Switch to list view
      cy.get(commonLocators.listToggle).click();
      PageLeftPane.assertPresence("Api1");
      agHelper.GetNClick(apiPage.splitPaneContextMenuTrigger, 0, true);
      cy.contains("Show bindings").click();

      // Assert that the bindings menu is visible
      cy.xpath(commonLocators.showBindingsMenu).should("be.visible");

      // Expected bindings for the API
      const expectedApiBindings = [
        "{{Api1.isLoading}}",
        "{{Api1.data}}",
        "{{Api1.responseMeta}}",
        "{{Api1.run()}}",
        "{{Api1.clear()}}",
      ];

      // Validate that the bindings in the menu match the expected bindings
      cy.get(apiWidgetLocator.propertyList).then(($lis) => {
        validateBindings($lis, expectedApiBindings);
      });
    });
  },
);
