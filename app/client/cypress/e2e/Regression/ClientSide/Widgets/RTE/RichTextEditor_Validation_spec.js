import { locators } from "../../../../../support/Objects/ObjectsCore";

const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "RichTextEditor Widget Validation",
  { tags: ["@tag.All", "@tag.TextEditor", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formdsl1");
      cy.waitUntil(() =>
        cy.get(locators._richText_TitleBlock).should("be.visible"),
      );
    });

    beforeEach(() => {
      cy.wait(7000);
      cy.openPropertyPane("richtexteditorwidget");
    });

    it("RichTextEditor-required with empty content show error border for textarea", function () {
      cy.setTinyMceContent("rte-component-vw4zehojqt", "");
      cy.get(commonlocators.requiredCheckbox).click({ force: true });
      cy.wait(500);

      // check that input border is red
      cy.get(formWidgetsPage.richTextEditorWidget + " .tox.tox-tinymce").should(
        "have.css",
        "border",
        "1px solid rgb(217, 25, 33)",
      );

      cy.closePropertyPane();
    });
  },
);
