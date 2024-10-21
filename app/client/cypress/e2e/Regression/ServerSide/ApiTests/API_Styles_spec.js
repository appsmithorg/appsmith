import ApiEditor from "../../../../locators/ApiEditor";
import DynamicInput from "../../../../locators/DynamicInput";
import HomePage from "../../../../locators/HomePage";

import { apiPage } from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validate API Panel CSS Styles",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    const backgroundColorGray200 = "rgb(227, 232, 239)";
    const backgroundColorwhite = "rgb(255, 255, 255)";
    const hover = "rgb(241, 245, 249)";
    const fontColorGray800 = "rgb(106, 117, 133)";

    before(() => {
      //Create test api
      apiPage.CreateApi("test_styles");
    });

    it("1.Quick access command background color", function () {
      //Get the first key component (can be any of key value component)
      //eq(1) is used because eq(0) is API serach bar.
      cy.get(ApiEditor.codeEditorWrapper).eq(1).click();
      //Check color and background-color of binding prompt
      cy.get(DynamicInput.bindingPrompt)
        .should("have.css", "color", fontColorGray800)
        .should("have.css", "background-color", backgroundColorGray200);
    });

    it("2.HTTP method dropdown hover and selected background should be gray", function () {
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
        .should("have.css", "background-color", hover)
        .click();
    });

    it("3.Slash command button shows up on hover", function () {
      //Get the first key component (can be any of key value component)
      //eq(1) is used because eq(0) is API serach bar.
      cy.get(ApiEditor.codeEditorWrapper).eq(1).realHover();
      //Get the slash cmd button and check visibility
      cy.get(ApiEditor.slashCommandButton)
        .eq(1)
        .should("have.css", "visibility", "visible");
    });

    it("4. Select Datasource dropdown binding prompt background color", function () {
      cy.generateUUID().then((appName1) => {
        cy.generateUUID().then((appName2) => {
          //Create two datasource for testing binding prompt background-color
          cy.createNewAuthApiDatasource(appName1);
          cy.createNewAuthApiDatasource(appName2);
          AppSidebar.navigate(AppSidebarButton.Editor);
          EditorNavigation.SelectEntityByName("test_styles", EntityType.Api);
          //Click on API search editor
          cy.get(ApiEditor.codeEditorWrapper).first().click();
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
            .should("have.css", "background-color", hover);
          //Delete created test API
          cy.DeleteAPI();
          AppSidebar.navigate(AppSidebarButton.Editor);
          cy.wait(2000);
          PageLeftPane.assertAbsence("test_styles");
          //Delete two datasources
          cy.deleteDatasource(appName1);
          cy.deleteDatasource(appName2);
        });
      });
    });

    after(() => {
      //Delete Application
      cy.get(HomePage.applicationName).click();
      cy.get("div[role='menuitem']").contains("Delete application").click();
      cy.get("div[role='menuitem']").contains("Are you sure?").click();
    });
  },
);
