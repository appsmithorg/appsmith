import ApiEditor from "../../../../locators/ApiEditor";
import DynamicInput from "../../../../locators/DynamicInput";
import HomePage from "../../../../locators/HomePage";
const pages = require("../../../../locators/Pages.json");
const datasourcesEditor = require("../../../../locators/DatasourcesEditor.json");
const commonLocators = require("../../../../locators/commonlocators.json");

describe("Validate API Panel CSS Styles", function() {
  const backgroundColorGray200 = "rgb(231, 231, 231)";
  const backgroundColorwhite = "rgb(255, 255, 255)";
  const fontColorGray800 = "rgb(57, 57, 57)";

  before(() => {
    //Create test api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("test_styles");
  });

  it("1.Quick access command background color", function() {
    //Get the first key component (can be any of key value component)
    //eq(1) is used because eq(0) is API serach bar.
    cy.get(ApiEditor.codeEditorWrapper)
      .eq(1)
      .click();
    //Check color and background-color of binding prompt
    cy.get(DynamicInput.bindingPrompt)
      .should("have.css", "color", fontColorGray800)
      .should("have.css", "background-color", backgroundColorGray200);
  });

  it("2.HTTP method dropdown hover and selected background should be gray", function() {
    //Click on API http selector
    cy.get(ApiEditor.ApiVerb).click();
    //Default selection GET background-color check
    cy.get(ApiEditor.httpDropDownOptions)
      .first()
      .should("have.css", "background-color", backgroundColorGray200);
    //Last element (can be any child other than the default) background-color check
    //On hover background-color should change.
    cy.get(ApiEditor.httpDropDownOptions)
      .last()
      .should("have.css", "background-color", backgroundColorwhite)
      .realHover()
      .should("have.css", "background-color", backgroundColorGray200)
      .click();
  });

  it("3.Commands help button center align", function() {
    //Get the first key component (can be any of key value component)
    //eq(1) is used because eq(0) is API serach bar.
    cy.get(ApiEditor.codeEditorWrapper)
      .eq(1)
      .realHover();
    //Get the slash icon component and check background
    //Check center alignment
    //Get width and height (have use inner function because values are not accessible outside functional scope);
    //Comapre transform matrix value (Cypress decodes all transform values into matrix)
    cy.get(ApiEditor.slashCommandButton)
      .first()
      .should("have.css", "right", "0px")
      .invoke("outerWidth")
      .then((width) =>
        cy
          .get(ApiEditor.slashCommandButton)
          .first()
          .invoke("outerHeight")
          .then((height) =>
            cy
              .get(ApiEditor.slashCommandButton)
              .first()
              .should(
                "have.css",
                "transform",
                `matrix(1, 0, 0, 1, -${width / 2}, ${height / 2})`,
              ),
          ),
      );
  });

  it("4.Select Datasource dropdown binding prompt background color", function() {
    cy.generateUUID().then((appName1) => {
      cy.generateUUID().then((appName2) => {
        //Create two datasource for testing binding prompt background-color
        cy.createNewAuthApiDatasource(appName1);
        cy.createNewAuthApiDatasource(appName2);
        cy.get(commonLocators.entityName)
          .contains("test_styles")
          .click();
        //Click on API search editor
        cy.get(ApiEditor.codeEditorWrapper)
          .first()
          .click();
        //First hint for search background-color test
        cy.get(ApiEditor.apiSearchHint)
          .first()
          .should("have.css", "background-color", backgroundColorGray200);
        //Last element (can be any child other than the default) background-color check
        //On hover background-color should change.
        cy.get(ApiEditor.apiSearchHint)
          .last()
          .should("have.css", "background-color", backgroundColorwhite)
          .realHover()
          .should("have.css", "background-color", backgroundColorGray200);
        //Delete created test API
        cy.DeleteAPI();
        cy.wait(2000);
        cy.get(commonLocators.entityName)
          .contains("test_styles")
          .should("not.exist");
        //Delete two datasources
        cy.deleteDatasource(appName1);
        cy.deleteDatasource(appName2);
      });
    });
  });

  after(() => {
    //Delete Application
    cy.get(HomePage.applicationName).click();
    cy.get(".t--application-edit-menu li")
      .contains("Delete Application")
      .click();
    cy.get(".t--application-edit-menu li")
      .contains("Are you sure?")
      .click();
  });
});
