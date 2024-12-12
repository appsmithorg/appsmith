/// <reference types="Cypress" />

import apiLocators from "../../../../locators/ApiEditor";

import {
  agHelper,
  entityExplorer,
  deployMode,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

import BottomTabs from "../../../../support/Pages/IDE/BottomTabs";

describe(
  "Test Create Api and Bind to List widget",
  { tags: ["@tag.Binding"] },
  function () {
    let valueToTest;
    before(() => {
      agHelper.AddDsl("listwidgetdsl");
    });

    it("1. Test_Add users api and execute api", function () {
      apiPage.CreateAndFillApi(this.dataSet.userApi + "/mock-api?records=10");
      cy.RunAPI();
      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");
      cy.get(apiLocators.responseBody)
        .contains("name")
        .siblings("span")
        .invoke("text")
        .then((text) => {
          valueToTest = `${text
            .match(/"(.*)"/)[0]
            .split('"')
            .join("")}`;
          cy.log(valueToTest);
          cy.log("val1:" + valueToTest);
        });
    });

    it("2. Test_Validate the Api data is updated on List widget", function () {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      cy.testJsontext("items", "{{Api1.data}}");
      cy.get(".t--draggable-textwidget span").should("have.length", 8);
      cy.get(".t--draggable-textwidget span")
        .first()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal(valueToTest);
        });
      deployMode.DeployApp();
      cy.wait("@postExecute").then((interception) => {
        valueToTest = JSON.stringify(
          interception.response.body.data.body[0].name,
        ).replace(/['"]+/g, "");
      });
      cy.waitUntil(
        () => cy.get(".t--widget-textwidget span").should("be.visible"),
        {
          errorMsg: "Pubish app page is not loaded even after 20 seconds",
          timeout: 20000,
          interval: 1000,
        },
      );

      cy.get(".t--widget-textwidget span").should("have.length", 8);
      cy.get(".t--widget-textwidget span")
        .first()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal(valueToTest);
        });
    });

    it("3. Test_Validate the list widget ", function () {
      deployMode.NavigateBacktoEditor();
      cy.wait("@postExecute").then((interception) => {
        valueToTest = JSON.stringify(
          interception.response.body.data.body[0].name,
        ).replace(/['"]+/g, "");
      });
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      cy.moveToStyleTab();
      cy.testJsontext("itemspacing\\(px\\)", "50");
      cy.get(".t--draggable-textwidget span").should("have.length", 6);
      cy.get(".t--draggable-textwidget span")
        .first()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal(valueToTest);
        });
      deployMode.DeployApp();
      cy.wait("@postExecute").then((interception) => {
        valueToTest = JSON.stringify(
          interception.response.body.data.body[0].name,
        ).replace(/['"]+/g, "");
      });
      cy.waitUntil(
        () => cy.get(".t--widget-textwidget span").should("be.visible"),
        {
          errorMsg: "Pubish app page is not loaded even after 20 seconds",
          timeout: 20000,
          interval: 1000,
        },
      );
      cy.get(".t--widget-textwidget span").should("have.length", 6);
      cy.get(".t--widget-textwidget span")
        .first()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal(valueToTest);
        });
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
