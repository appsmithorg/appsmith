// <reference types="Cypress" />
import {
  agHelper,
  deployMode,
  entityExplorer,
  table,
  locators,
} from "../../support/Objects/ObjectsCore";

describe("Xolair Application check in deploy mode", () => {
  before(() => {
      // Navigate to the test application
      cy.visit(
          "http://ec2-3-110-218-99.ap-south-1.compute.amazonaws.com/app/application/page-67a229a76579413798820d52",
      );
  });
  it("1. Check if the patient tab is displayed or not", () => {
      // check all the tabs in xolair app
      agHelper.AssertElementVisibility(locators._widgetByName("lookup_tab"));
      cy.get(locators._tabWidget("2")).click().should("be.visible");
      //cy.get(locators._tabWidget("3")).click().should("be.visible");
      cy.get(locators._tabWidget("1")).click().should("be.visible");
      //cy.get(".t--tab-Patients").should("be.visible");

  });
});

    






