import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "FilePicker Widget Functionality with different file types",
  { tags: ["@tag.All", "@tag.Filepicker", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("filepickerDsl");
    });

    it("1. Check file upload of type jpeg", function () {
      EditorNavigation.SelectEntityByName("FilePicker1", EntityType.Widget);

      const fixturePath = "cypress/fixtures/AAAFlowerVase.jpeg";
      cy.get(commonlocators.filepickerv2).click();
      cy.get(commonlocators.filePickerInput).first().selectFile(fixturePath, {
        force: true,
      });
      cy.get(commonlocators.filePickerUploadButton).click();
      cy.get(commonlocators.dashboardItemName).contains("AAAFlowerVase.jpeg");
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get("button").contains("Upload 1 file");
    });

    it("2. Replace an existing file type with another file type", function () {
      cy.get(commonlocators.filepickerv2).click();
      cy.get("button.uppy-Dashboard-Item-action--remove").click();
      cy.get("button.uppy-Dashboard-browse").should("be.visible");
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/appsmithlogo.png", {
          force: true,
        });
      cy.get(commonlocators.filePickerUploadButton).click();
      cy.get(commonlocators.filepickerv2).click();
      cy.get(commonlocators.dashboardItemName).contains("appsmithlogo.png");
      //eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
      cy.get("button").contains("Upload 1 file");
    });
  },
);
