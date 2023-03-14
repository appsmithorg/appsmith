const dsl = require("../../../../fixtures/dynamicHeightFormSwitchdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation", function() {
  it("Validate change with auto height width for Form/Switch", function() {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("formwidget");
    cy.get(".t--widget-formwidget")
      .invoke("css", "height")
      .then((formheight) => {
        cy.changeLayoutHeight(commonlocators.autoHeight);
        cy.openPropertyPane("switchgroupwidget");
        cy.changeLayoutHeight(commonlocators.autoHeight);
        cy.get(".t--widget-switchgroupwidget")
          .invoke("css", "height")
          .then((switchheight) => {
            cy.get(".t--widget-formwidget")
              .invoke("css", "height")
              .then((newformheight) => {
                //expect(formheight).to.not.equal(newformheight)
                cy.updateCodeInput(
                  ".t--property-control-options",
                  `[
              {
                "label": "Blue",
                "value": "BLUE"
              },
              {
                "label": "Green",
                "value": "GREEN"
              },
              {
                "label": "Red",
                "value": "RED"
              },
              {
                "label": "Yellow",
                "value": "YELLOW"
              },
              {
                "label": "Purple",
                "value": "PURPLE"
              },
              {
                "label": "Pink",
                "value": "PINK"
              },
              {
                "label": "Black",
                "value": "BLACK"
              },
              {
                "label": "Grey",
                "value": "GREY"
              },
              {
                "label": "Orange",
                "value": "ORANGE"
              },
              {
                "label": "Cream",
                "value": "CREAM"
              }
            ]`,
                );
                cy.get(".t--widget-switchgroupwidget")
                  .invoke("css", "height")
                  .then((newswitchheight) => {
                    cy.get(".t--widget-formwidget")
                      .invoke("css", "height")
                      .then((updatedformheight) => {
                        expect(newformheight).to.not.equal(updatedformheight);
                        expect(switchheight).to.not.equal(newswitchheight);
                      });
                  });
              });
          });
      });
    cy.get(".t--draggable-switchgroupwidget .bp3-control-indicator")
      .first()
      .click({ force: true });
    cy.wait(3000);
    cy.get(".t--modal-widget").should("have.length", 1);
    cy.get(".t--widget-propertypane-toggle")
      .first()
      .click({ force: true });
    //cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
    //cy.checkMinDefaultValue(commonlocators.minHeight,"4")
    //cy.checkMaxDefaultValue(commonlocators.maxHeight,"24")
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.wait(3000);
    cy.get("button:contains('Close')").click({ force: true });
  });
});
