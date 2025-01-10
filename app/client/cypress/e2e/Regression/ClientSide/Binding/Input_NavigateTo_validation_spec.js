/// <reference types="Cypress" />

import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
const pageid = "MyPage";
import {
  agHelper,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Binding the multiple Widgets and validating NavigateTo Page",
  { tags: ["@tag.Binding"] },
  function () {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    before(() => {
      agHelper.AddDsl("tableInputDsl");
    });

    it("1. Create MyPage and valdiate if its successfully created", function () {
      cy.Createpage(pageid);
      agHelper.AddDsl("displayWidgetDsl");
      cy.get(commonlocators.pageNameField).should("be.visible");
      PageList.ShowList();
      PageLeftPane.assertPresence(pageid);
    });

    it("2. Input widget test with default value from table widget", function () {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      cy.get(widgetsPage.defaultInput).type(testdata.defaultInputWidget);
      propPane.SelectPlatformFunction("onTextChanged", "Navigate to");
      cy.get(".t--open-dropdown-Select-page").click();
      cy.get(commonlocators.singleSelectMenuItem)
        .contains(pageid)
        .click({ force: true });
      agHelper.AssertAutoSave();
    });

    it("3. Validate NavigateTo Page functionality ", function () {
      cy.get(".t--widget-tablewidget").should("be.visible");
      table.SelectTableRow(1);
      cy.readTabledataPublish("1", "0").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("2736212");
        cy.wait(2000);
        cy.get(publish.inputWidget + " " + "input")
          .first()
          .invoke("attr", "value")
          .should("contain", tabValue);
        cy.get(widgetsPage.chartWidget).should("not.exist");
        cy.get(publish.inputGrp).first().type("123").wait(2000);
        cy.waitUntil(
          () => cy.get(widgetsPage.chartWidget).should("be.visible"),
          {
            errorMsg: "Execute call did not complete evn after 20 secs",
            timeout: 20000,
            interval: 1000,
          },
        );
      });
    });
  },
);
