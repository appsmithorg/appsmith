import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const omnibar = require("../../../../locators/Omnibar.json");
import {
  agHelper,
  entityExplorer,
  assertHelper,
  deployMode,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Omnibar functionality test cases", () => {
  const apiName = "Omnibar1";
  const jsObjectName = "Omnibar2";

  before(() => {
    agHelper.AddDsl("omnibarDsl");
  });

  it("1. Bug #15104  Docs tab opens after clicking on learn more link from property pane", function () {
    cy.dragAndDropToCanvas(draggableWidgets.AUDIO, { x: 300, y: 500 });
    agHelper.Sleep(2000);
    deployMode.StubWindowNAssert(
      '//span[text()="Learn more"]',
      "connect-to-a-database",
      "getPluginForm",
    );
  });

  it("2.Verify omnibar is present across all pages and validate its fields", function () {
    cy.get(omnibar.globalSearch)
      .trigger("mouseover")
      .should("have.css", "background-color", "rgb(255, 255, 255)");
    cy.get(omnibar.globalSearch).click({ force: true });
    // verifying all sections are present in omnibar
    cy.get(omnibar.categoryTitle)
      .eq(0)
      .should("have.text", "Navigate")
      .next()
      .should(
        "have.text",
        "Navigate to any page, widget or file across this project.",
      );
    cy.get(omnibar.categoryTitle)
      .eq(1)
      .should("have.text", "Create new")
      .next()
      .should("have.text", "Create a new query, API or JS Object");
    cy.get("body").type("{esc}");
  });

  it("3. Verify Create new section and its data, also create a new api, new js object and new cURL import from omnibar ", function () {
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
    cy.get(".t--js-action-name-edit-field").type(jsObjectName).wait(1000);

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
    agHelper.RenameWithInPane(apiName);

    agHelper.GetNClick(omnibar.globalSearch, 0, true);
    agHelper.GetNClickByContains(omnibar.categoryTitle, "Create new");
    agHelper.GetNClickByContains(omnibar.createNew, "New cURL import");
    cy.wait(1000);
    cy.url().should("include", "curl-import?");
    cy.get('p:contains("Import from CURL")').should("be.visible");
  });

  it(
    "excludeForAirgap",
    "4. On an invalid search, discord link should be displayed and on clicking that link, should open discord in new tab",
    function () {
      // typing a random string in search bar
      cy.get(omnibar.globalSearch).click({ force: true });
      cy.wait(1000);
      cy.get(omnibar.globalSearchInput).type("vnjkv");
      cy.wait(2000);
      cy.get(omnibar.globalSearchInput).should("have.value", "vnjkv");
      // discord link should be visible
      cy.get(omnibar.discordLink).should("be.visible");
      // cy.window().then((win) => {
      //   cy.stub(win, "open", (url) => {
      //     win.location.href = "https://discord.com/invite/rBTTVJp";
      //   }).as("discordLink");
      // });
      // cy.url().then(($urlBeforeDiscord) => {
      //   // clicking on discord link should open discord
      //   agHelper.GetNClick(omnibar.discordLink, 0, false, 4000);
      //   cy.get("@discordLink").should("be.called");
      //   cy.wait(2000);
      //   //cy.go(-1);
      //   cy.visit($urlBeforeDiscord);
      //   cy.wait(4000); //for page to load
      // });

      deployMode.StubWindowNAssert(
        omnibar.discordLink,
        "https://discord.com/invite/rBTTVJp",
        "getPluginForm",
      );
    },
  );

  it("5. Verify Navigate section shows recently opened widgets and datasources", function () {
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

    cy.xpath(omnibar.recentlyopenItem)
      .eq(3)
      .should("have.text", "Audio1")
      .next()
      .should("have.text", "Page1");

    cy.xpath(omnibar.recentlyopenItem).eq(4).should("have.text", "Page1");
  });
});
