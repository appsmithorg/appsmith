const commonlocators = require("../../../../locators/commonlocators.json");
const themelocator = require("../../../../locators/ThemeLocators.json");

import { multiSelectWidgetLocators } from "../../../../locators/WidgetLocators";
import {
  agHelper,
  locators,
  entityExplorer,
  deployMode,
  appSettings,
  theme,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

let themeFont;

describe(
  "Theme validation usecase for multi-select widget",
  { tags: ["@tag.Theme", "@tag.Git"] },
  function () {
    it("1. Drag and drop multi-select widget and validate Default font and list of font validation + Bug 15007", function () {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.MULTISELECT,
        300,
        80,
      );
      agHelper.GetNClick(locators._canvas);
      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();

      cy.xpath(
        "//p[text()='App font']/following-sibling::section//div//input",
      ).then(($elem) => {
        agHelper.GetNClick($elem);

        agHelper
          .GetElement(themelocator.fontsSelected)
          .should("contain.text", "Nunito Sans");

        agHelper
          .GetElement(themelocator.fontOption)
          .find(themelocator.fontsSelected)
          .eq(3)
          .then(($childElem) => {
            cy.get($childElem).click({ force: true });
            cy.get(".t--draggable-multiselectwidgetv2:contains('more')").should(
              "have.css",
              "font-family",
              `Inter, sans-serif`,
            );
            themeFont = `Inter, sans-serif`;
          });
      });

      cy.contains("Font").click({ force: true });

      appSettings.ClosePane();
    });

    it("2. Publish the App and validate Font across the app", function () {
      deployMode.DeployApp();
      agHelper
        .GetElement(
          multiSelectWidgetLocators.multiSelectWidgetSelectedOptionContent,
        )
        .first()
        .should("have.css", "font-family", themeFont);
      agHelper
        .GetElement(
          multiSelectWidgetLocators.multiSelectWidgetSelectedOptionContent,
        )
        .last()
        .should("have.css", "font-family", themeFont);
      deployMode.NavigateBacktoEditor();
    });

    it("3. Apply theme and validate the color", function () {
      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();
      agHelper.GetNClick(commonlocators.changeThemeBtn, 0, true);
      agHelper.GetNClick(
        `${themelocator.featuredThemeSection} [data-testid='t--theme-card-Sunrise']`,
      );

      deployMode.DeployApp();

      agHelper.GetNClick(multiSelectWidgetLocators.multiSelectWidgetTrigger);
      agHelper
        .GetElement(
          multiSelectWidgetLocators.multiSelectWidgetDropdownOptionCheckbox,
        )
        .first()
        .should("have.css", "background-color", "rgb(239, 68, 68)");
    });
  },
);
