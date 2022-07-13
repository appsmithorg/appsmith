const queryLocators = require("../../../../locators/QueryEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const formControls = require("../../../../locators/FormControl.json");
import homePage from "../../../../locators/HomePage";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

let datasourceName;

describe("Verify setting tab form controls not to have tooltip and tooltip (underline) styles", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Creates a new Mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm();
    cy.generateUUID().then((uid) => {
      datasourceName = `Mongo CRUD ds ${uid}`;
      cy.renameDatasource(datasourceName);
    });
    cy.testSaveDatasource();
  });

  it("2. We make sure the label in the settings tab does not have any underline styles", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);

    cy.get(queryLocators.querySettingsTab).click();

    cy.get(".label-icon-wrapper")
      .contains("Run query on page load")
      .parent()
      .then(($el) => {
        cy.window().then((win) => {
          cy.log($el, win);
          const after = win.getComputedStyle($el[0], "::after");
          cy.log($el, win, after);
          const afterBorderBottom = after.getPropertyValue("borderBottom");
          //   we expect the border bottom of the element to be an empty string as opposed to "1px dashed"
          expect(afterBorderBottom).to.equal("");
        });
      });

    cy.get(".label-icon-wrapper")
      .contains("Request confirmation before running query")
      .parent()
      .then(($el) => {
        cy.window().then((win) => {
          cy.log($el, win);
          const after = win.getComputedStyle($el[0], "::after");
          cy.log($el, win, after);
          const afterBorderBottom = after.getPropertyValue("borderBottom");
          //   we expect the border bottom of the element to be an empty string as opposed to "1px dashed"
          expect(afterBorderBottom).to.equal("");
        });
      });
  });
});
