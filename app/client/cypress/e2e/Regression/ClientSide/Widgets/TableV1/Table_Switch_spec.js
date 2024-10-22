/* eslint-disable cypress/no-unnecessary-waiting */
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget and Switch binding Functionality",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("swtchTableDsl");
    });

    it("Table Widget Data validation with Switch ON", function () {
      cy.openPropertyPane("tablewidget");
      cy.readTabledataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("30");
        cy.log("the value is" + tabValue);
      });
      cy.get(".t--switch-widget-active .bp3-control-indicator").click({
        force: true,
      });
      cy.wait(5000);
      cy.readTabledataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("9");
        cy.log("the value is" + tabValue);
      });
      cy.get(".t--switch-widget-inactive .bp3-control-indicator").click({
        force: true,
      });
      cy.wait(5000);

      cy.readTabledataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        expect(tabValue).to.be.equal("30");
        cy.log("the value is" + tabValue);
      });
    });

    it("Selected row and binding with Text widget", function () {
      cy.wait(5000);
      cy.get(".t--table-multiselect").eq(1).click({ force: true });
      cy.get(".t--draggable-textwidget .bp3-ui-text span").should(
        "contain.text",
        "30",
      );
      cy.get(".t--table-multiselect").eq(0).click({ force: true });
      cy.get(".t--draggable-textwidget .bp3-ui-text span").should(
        "contain.text",
        "29",
      );
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
