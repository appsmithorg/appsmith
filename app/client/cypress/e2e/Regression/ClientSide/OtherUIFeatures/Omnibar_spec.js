import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const omnibar = require("../../../../locators/Omnibar.json");
import {
  agHelper,
  assertHelper,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";

describe("Omnibar functionality test cases", () => {
  const apiName = "Omnibar1";
  const jsObjectName = "Omnibar2";

  before(() => {
    agHelper.AddDsl("omnibarDsl");
  });

  it("1.Verify omnibar is present across all pages and validate its fields", function () {
    cy.get(omnibar.globalSearch)
      .trigger("mouseover")
      .should("have.css", "background-color", "rgb(255, 255, 255)");
    cy.get(omnibar.globalSearch).click({ force: true });
    // verifying all sections are present in omnibar
    cy.get(omnibar.categoryTitle)
      .eq(0)
      .should("have.text", "Navigate")
      .next()
      .should("have.text", Cypress.env("MESSAGES").NAV_DESCRIPTION());
    cy.get(omnibar.categoryTitle)
      .eq(1)
      .should("have.text", "Create new")
      .next()
      .should(
        "have.text",
        Cypress.env("MESSAGES").ACTION_OPERATION_DESCRIPTION(),
      );
    cy.get("body").type("{esc}");
  });

  it("2. Verify Create new section and its data, also create a new api, new js object and new cURL import from omnibar ", function () {
    cy.intercept("POST", "/api/v1/actions").as("createNewApi");
    cy.intercept("POST", "/api/v1/collections/actions").as(
      "createNewJSCollection",
    );
    cy.get(omnibar.globalSearch).click({ force: true });
    cy.get(omnibar.categoryTitle).contains("Create new").click();

    // create new api, js object and cURL import from omnibar
    cy.get(omnibar.createNew).contains("New JS Object").click();
    cy.wait(1000);
    cy.wait("@createNewJSCollection");
    cy.wait(1000);
    jsEditor.RenameJSObjFromPane(jsObjectName);

    agHelper.GetNClick(omnibar.globalSearch, 0, true, 2000);
    agHelper.GetNClickByContains(
      omnibar.categoryTitle,
      "Create new",
      0,
      false,
      2000,
    ); //for next screen to open
    agHelper.AssertElementVisibility(omnibar.blankAPI);
    agHelper.GetNClickByContains(omnibar.createNew, "New blank API");
    assertHelper.AssertNetworkStatus("@createNewApi", 201);
    EditorNavigation.SelectEntityByName("Api1", EntityType.Api);
    agHelper.AssertURL("/api");
    agHelper.RenameQuery(apiName);

    agHelper.GetNClick(omnibar.globalSearch, 0, true);
    agHelper.GetNClickByContains(omnibar.categoryTitle, "Create new");
    agHelper.GetNClickByContains(omnibar.createNew, "New cURL import");
    cy.wait(1000);
    cy.get('p:contains("Import from CURL")').should("be.visible");
  });

  it(
    "3. On an invalid search, discord link should be displayed and on clicking that link, should open discord in new tab",
    { tags: ["@tag.excludeForAirgap"] },
    function () {
      // typing a random string in search bar
      cy.get(omnibar.globalSearch).click({ force: true });
      cy.wait(1000);
      cy.get(omnibar.globalSearchInput).type("vnjkv");
      cy.wait(2000);
      cy.get(omnibar.globalSearchInput).should("have.value", "vnjkv");
      // discord link should be visible
      cy.get(omnibar.discordLink).should("be.visible");
      cy.get(".no-data-title").should("be.visible");
    },
  );

  it("4. Verify Navigate section shows recently opened widgets and datasources", function () {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    cy.get(omnibar.globalSearch).click({ force: true });
    cy.get(omnibar.categoryTitle).contains("Navigate").click();
    // verify recently opened items with their subtext i.e page name
    cy.xpath(omnibar.recentlyopenItem)
      .eq(0)
      .should("have.text", "Button1")
      .next()
      .should("have.text", "Page1");

    cy.xpath(omnibar.recentlyopenItem)
      .eq(1)
      .should("have.text", "Omnibar1")
      .next()
      .should("have.text", "Page1");

    cy.xpath(omnibar.recentlyopenItem)
      .eq(2)
      .should("have.text", "Omnibar2")
      .next()
      .should("have.text", "Page1");

    cy.xpath(omnibar.recentlyopenItem).eq(3).should("have.text", "Page1");
  });
});
