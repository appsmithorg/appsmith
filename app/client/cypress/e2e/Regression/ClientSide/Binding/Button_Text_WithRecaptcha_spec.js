const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "excludeForAirgap",
  "Binding the Button widget with Text widget using Recpatcha v3",
  function () {
    before(() => {
      _.agHelper.AddDsl("buttonRecaptchaDsl");
    });

    it("1. Validate the Button binding with Text Widget with Recaptcha token with empty key", function () {
      _.agHelper.ClickButton("Submit");
      _.agHelper
        .GetText(_.locators._widgetInCanvas("textwidget") + " span")
        .should("be.empty");
      _.entityExplorer.SelectEntityByName("Button1");
      _.agHelper.SelectDropdownList("Google reCAPTCHA version", "reCAPTCHA v2");
      _.agHelper.ClickButton("Submit");
      _.agHelper
        .GetText(_.locators._widgetInCanvas("textwidget") + " span")
        .should("be.empty");
      _.agHelper.SelectDropdownList("Google reCAPTCHA version", "reCAPTCHA v3");
    });

    //This test to be enabled once the product bug is fixed
    it.skip("Validate the Button binding with Text Widget with Recaptcha Token with invalid key before using valid key", function () {
      cy.get("button")
        .contains("Submit")
        .should("be.visible")
        .click({ force: true });
      cy.testCodeMirrorLast(testdata.invalidKey);
      _.entityExplorer.SelectEntityByName("Text1");

      cy.get(".t--draggable-textwidget span")
        .last()
        .invoke("text")
        .then((x) => {
          cy.log(x);
          expect(x).to.be.empty;
        });
      _.entityExplorer.SelectEntityByName("Button1");

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
      _.entityExplorer.SelectEntityByName("Text1");

      cy.wait(3000);
      cy.get(".t--draggable-textwidget span")
        .last()
        .invoke("text")
        .then((x) => {
          cy.log(x);
          expect(x).to.be.empty;
        });
    });

    it("2. Validate the Button binding with Text Widget with Recaptcha Token with v2Key & upward compatibilty doesnt work", function () {
      _.entityExplorer.SelectEntityByName("Button1");
      _.propPane.UpdatePropertyFieldValue(
        "Google reCAPTCHA key",
        testdata.v2Key,
      );
      _.agHelper.ClickButton("Submit");
      _.agHelper.Sleep();
      _.agHelper
        .GetText(_.locators._widgetInCanvas("textwidget") + " span")
        .should("be.empty");
      _.entityExplorer.SelectEntityByName("Button1");
      _.agHelper.SelectDropdownList("Google reCAPTCHA version", "reCAPTCHA v2");
      _.agHelper.ClickButton("Submit");
      _.agHelper.Sleep();
      _.agHelper
        .GetText(_.locators._widgetInCanvas("textwidget") + " span")
        .should("not.be.empty");
      _.agHelper.SelectDropdownList("Google reCAPTCHA version", "reCAPTCHA v3");
      _.agHelper.ClickButton("Submit");
      _.agHelper.Sleep();
    });

    it("3. Validate the Button binding with Text Widget with Recaptcha Token with v3Key & v2key for backward compatible", function () {
      _.entityExplorer.SelectEntityByName("Button1");
      _.propPane.UpdatePropertyFieldValue(
        "Google reCAPTCHA key",
        testdata.v3Key,
      );
      _.agHelper.SelectDropdownList("Google reCAPTCHA version", "reCAPTCHA v3");
      _.agHelper.ClickButton("Submit");
      _.agHelper.Sleep();
      cy.get("body").then(($ele) => {
        if (
          $ele.find(
            _.locators._specificToast(
              "Google Re-Captcha token generation failed!",
            ),
          ).length ||
          $ele
            .find(_.locators._widgetInCanvas("textwidget") + " span")
            .text() == ""
        ) {
          _.agHelper.ClickButton("Submit");
        }
      });
      _.agHelper
        .GetText(_.locators._widgetInCanvas("textwidget") + " span")
        .should("not.be.empty");
      _.entityExplorer.SelectEntityByName("Button1");
      _.agHelper.SelectDropdownList("Google reCAPTCHA version", "reCAPTCHA v2");
      _.agHelper.ClickButton("Submit");
      _.agHelper.AssertContains("Google Re-Captcha token generation failed!"); //toast doesnt come when run in CI!
    });

    //This test to be enabled once the product bug is fixed
    it.skip("Validate the Button binding with Text Widget with Recaptcha Token with invalid key", function () {
      cy.get("button")
        .contains("Submit")
        .should("be.visible")
        .click({ force: true });
      cy.testCodeMirrorLast(testdata.invalidKey);
      _.entityExplorer.SelectEntityByName("Text1");

      cy.get(".t--draggable-textwidget span")
        .last()
        .invoke("text")
        .then((x) => {
          cy.log(x);
          expect(x).not.to.be.empty;
        });
      _.entityExplorer.SelectEntityByName("Button1");

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
      _.entityExplorer.SelectEntityByName("Text1");

      cy.wait(3000);
      cy.get(".t--draggable-textwidget span")
        .last()
        .invoke("text")
        .then((x) => {
          cy.log(x);
          expect(x).not.to.be.empty;
        });
    });
  },
);
