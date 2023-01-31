import * as _ from "../../../support/Objects/ObjectsCore";

describe("Validate basic test harness", () => {
  before(() => {
    _.homePage.Signout();
  });

  it("1. Button with Input widget", () => {
    cy.visit(
      "http://localhost/app/testharnesstest/page1-63d8dba3162a4179a205f476",
    ); //Public app
    _.table.SelectTableRow(3);
    _.table.ReadTableRowColumnData(3, 2).then(($cellData) => {
      _.agHelper.GetNAssertContains(
        _.locators._widgetInDeployed("textwidget"),
        $cellData,
      );
    });

    _.table.SelectTableRow(8);
    _.table.ReadTableRowColumnData(8, 2).then(($cellData) => {
      _.agHelper.GetNAssertContains(
        _.locators._widgetInDeployed("textwidget"),
        $cellData,
      );
    });
  });

  it.only("2. Test GSHeet in View mode", () => {
    cy.origin("https://app.appsmith.com/", () => {
      cy.visit(
        "https://app.appsmith.com/app/storytellingdetails/displaystorytellingdetails-62384a584d9aea1b062ae5e3",
      );
      // Commands are executed in secondary origin
      //cy.get('h1').contains('About our Founder, Marvin Acme')
      // Passed in values are accessed via callback args
      //cy.get('#hitcounter').contains(hits)
    });
  });
});
