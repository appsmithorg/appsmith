const dsl = require("../../../../fixtures/buttonRecaptchaDsl.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the Button widget with Text widget using Recpatcha v3", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Validate the Button binding with Text Widget with Recaptcha token with empty key", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("be.visible");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("have.value", "");
    cy.SearchEntityandOpen("Button1");
    cy.get(".t--property-control-googlerecaptchaversion .bp3-popover-target")
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(".t--dropdown-option:contains('reCAPTCHA v2')").click({
      force: true,
    });
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("be.visible");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("have.value", "");
  });

  /* This test to be enabled once the product bug is fixed
  it("Validate the Button binding with Text Widget with Recaptcha Token with invalid key before using valid key", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.testCodeMirrorLast(testdata.invalidKey)
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget span").last().invoke('text').then((x) => {
      cy.log(x);
      expect(x).to.be.empty;
    })
    cy.SearchEntityandOpen("Button1");
    cy.get(".t--property-control-googlerecaptchaversion .bp3-popover-target")
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(".t--dropdown-option:contains('reCAPTCHA v2')").click({
      force: true,
    });
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.get(".t--toast-action span").should("have.text",testdata.errorMsg)
    cy.SearchEntityandOpen("Text1");
    cy.wait(3000);
    cy.get(".t--draggable-textwidget span").last().invoke('text').then((x) => {
      cy.log(x);
      expect(x).to.be.empty;
    })
  });
*/
  it("2. Validate the Button binding with Text Widget with Recaptcha Token with v2Key", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.testCodeMirrorLast(testdata.v2Key);
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget span")
      .last()
      .invoke("text")
      .then((x) => {
        cy.log(x);
        expect(x).to.be.empty;
      });
    cy.SearchEntityandOpen("Button1");
    cy.get(".t--property-control-googlerecaptchaversion .bp3-popover-target")
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(".t--dropdown-option:contains('reCAPTCHA v2')").click({
      force: true,
    });
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.SearchEntityandOpen("Text1");
    cy.wait(3000);
    cy.get(".t--draggable-textwidget span")
      .last()
      .invoke("text")
      .then((x) => {
        cy.log(x);
        expect(x).not.to.be.empty;
      });
  });

  it("3. Validate the Button binding with Text Widget with Recaptcha Token with v3Key", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.testCodeMirrorLast(testdata.v3Key);
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget span")
      .last()
      .invoke("text")
      .then((x) => {
        cy.log(x);
        expect(x).not.to.be.empty;
      });
    cy.SearchEntityandOpen("Button1");
    cy.get(".t--property-control-googlerecaptchaversion .bp3-popover-target")
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(".t--dropdown-option:contains('reCAPTCHA v2')").click({
      force: true,
    });
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.SearchEntityandOpen("Text1");
    cy.wait(3000);
    cy.get(".t--draggable-textwidget span")
      .last()
      .invoke("text")
      .then((x) => {
        cy.log(x);
        expect(x).not.to.be.empty;
      });
  });

  /* This test to be enabled once the product bug is fixed

  it("Validate the Button binding with Text Widget with Recaptcha Token with invalid key", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.testCodeMirrorLast(testdata.invalidKey)
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget span").last().invoke('text').then((x) => {
      cy.log(x);
      expect(x).not.to.be.empty;
    })
    cy.SearchEntityandOpen("Button1");
    cy.get(".t--property-control-googlerecaptchaversion .bp3-popover-target")
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(".t--dropdown-option:contains('reCAPTCHA v2')").click({
      force: true,
    });
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.SearchEntityandOpen("Text1");
    cy.wait(3000);
    cy.get(".t--draggable-textwidget span").last().invoke('text').then((x) => {
      cy.log(x);
      expect(x).not.to.be.empty;
    })
  });
  */
});
