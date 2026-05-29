import {
    agHelper,
    draggableWidgets,
    entityExplorer,
    propPane,
  } from "../../../../../support/Objects/ObjectsCore";
  import EditorNavigation, {
    EntityType,
  } from "../../../../../support/Pages/EditorNavigation";
  const commonlocators = require("../../../../../locators/commonlocators.json");

  describe(
    "FilePicker Widget Functionality",
    { tags: ["@tag.Widget", "@tag.Filepicker"] },
    function () {
      before(() => {
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.FILEPICKER);
      });

      it("Should display an error message when clicked on filepicker when max no-of files are set to 0", () => {
        EditorNavigation.SelectEntityByName("FilePicker1", EntityType.Widget);
        propPane.UpdatePropertyFieldValue("Max no. of files", "1");
        const fixturePath = "cypress/fixtures/dummy.pdf";
        cy.get(commonlocators.filepickerv2).click();
        cy.get(commonlocators.filePickerInput).first().selectFile(fixturePath, {
          force: true,
        });
        cy.get(commonlocators.filePickerUploadButton).click();
        cy.get(commonlocators.dashboardItemName).contains("dummy.pdf");
        agHelper.GetNClick(commonlocators.filePickerRemoveButton, 0, true);
        propPane.UpdatePropertyFieldValue("Max no. of files", "0");
        cy.get(commonlocators.filepickerv2).click();
      });
    },
  );
