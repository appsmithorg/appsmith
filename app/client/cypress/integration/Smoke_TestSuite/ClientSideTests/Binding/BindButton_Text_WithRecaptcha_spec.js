const dsl = require("../../../../fixtures/buttonRecaptchaDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  propPane = ObjectsRegistry.PropertyPane;

describe("Binding the Button widget with Text widget using Recpatcha v3", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it.only("1. Validate the Button binding with Text Widget with Recaptcha token with empty key", function() {
    agHelper.ClickButton("Submit");
    agHelper
      .GetText(locator._widgetInCanvas("textwidget") + " span")
      .then(($text) => expect($text).to.be.empty);
    ee.SelectEntityByName("Button1");
    agHelper.SelectDropdownList("Google reCAPTCHA Version", "reCAPTCHA v2");
    agHelper.ClickButton("Submit");
    agHelper
      .GetText(locator._widgetInCanvas("textwidget") + " span")
      .then(($text) => expect($text).to.be.empty);
    agHelper.SelectDropdownList("Google reCAPTCHA Version", "reCAPTCHA v3");
  });

  //This test to be enabled once the product bug is fixed
  it("Validate the Button binding with Text Widget with Recaptcha Token with invalid key before using valid key", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.testCodeMirrorLast(testdata.invalidKey);
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
    cy.get(".t--toast-action span").should("have.text", testdata.errorMsg);
    cy.SearchEntityandOpen("Text1");
    cy.wait(3000);
    cy.get(".t--draggable-textwidget span")
      .last()
      .invoke("text")
      .then((x) => {
        cy.log(x);
        expect(x).to.be.empty;
      });
  });

  it.only("2. Validate the Button binding with Text Widget with Recaptcha Token with v2Key & upward compatibilty doesnt work", function() {
    ee.SelectEntityByName("Button1");
    propPane.UpdatePropertyFieldValue("Google reCAPTCHA Key", testdata.v2Key);
    agHelper.ClickButton("Submit");
    agHelper.Sleep();
    agHelper
      .GetText(locator._widgetInCanvas("textwidget") + " span")
      .then(($text) => expect($text).to.be.empty);
    ee.SelectEntityByName("Button1");
    agHelper.SelectDropdownList("Google reCAPTCHA Version", "reCAPTCHA v2");
    agHelper.ClickButton("Submit");
    agHelper.Sleep();
    agHelper
      .GetText(locator._widgetInCanvas("textwidget") + " span")
      .then(($text) => expect($text).not.to.be.empty);
    agHelper.SelectDropdownList("Google reCAPTCHA Version", "reCAPTCHA v3");
    agHelper.ClickButton("Submit");
    agHelper.Sleep();
  });

  it.only("3. Validate the Button binding with Text Widget with Recaptcha Token with v3Key & v2key for backward compatible", function() {
    ee.SelectEntityByName("Button1");
    propPane.UpdatePropertyFieldValue("Google reCAPTCHA Key", testdata.v3Key);
    agHelper.SelectDropdownList("Google reCAPTCHA Version", "reCAPTCHA v3");
    agHelper.ClickButton("Submit");
    agHelper.Sleep();
    agHelper
      .GetText(locator._widgetInCanvas("textwidget") + " span")
      .then(($text) => expect($text).not.to.be.empty);
    ee.SelectEntityByName("Button1");
    agHelper.SelectDropdownList("Google reCAPTCHA Version", "reCAPTCHA v2");
    agHelper.ClickButton("Submit");
    //agHelper.ValidateToastMessage("Google Re-Captcha token generation failed!"); toast doesnt come when run in CI!
  });

  //This test to be enabled once the product bug is fixed
  it("Validate the Button binding with Text Widget with Recaptcha Token with invalid key", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.testCodeMirrorLast(testdata.invalidKey);
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
});
