const Layoutpage = require("../../../../../locators/Layout.json");

import {
  agHelper,
} from "../../../../../support/Objects/ObjectsCore";

describe("Tab widget test", { tags: ["@tag.Widget", "@tag.Tab"] }, ()=> {
  before(() => {
    agHelper.AddDsl("layoutdsl");
  });
  it("1. Tab Widget Functionality To Check the duplication of a tab", ()=> {
    cy.openPropertyPane("tabswidget");
    agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{c}`);
    agHelper.Sleep(500);
    agHelper.GetElement("body").type(`{${agHelper._modifierKey}}{v}`);
    agHelper.Sleep(1000);
    cy.wait(2000)
    cy.openPropertyPane("tabswidget");
    cy.get(Layoutpage.tabNumber).should("have.text", "2");
    cy.xpath(Layoutpage.tabEdit.replace(
      "tabName",
      "Tab 1",
    )).first().click({ force: true });
    cy.openPropertyPane("tabswidget");
    cy.get(Layoutpage.tabNumber).should("have.text", "3");
    cy.get(Layoutpage.allTabWidgets).eq(2).click({force:true})
    cy.get(Layoutpage.tabContainer).children().should("have.length.at.least", 1);
  })
});

afterEach(() => {
    // put your clean up code if any
  });