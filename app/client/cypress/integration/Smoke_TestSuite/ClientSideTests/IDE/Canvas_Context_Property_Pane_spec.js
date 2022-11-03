import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dsl = require("../../../../fixtures/editorContextdsl.json");

const page1 = "Page1";
const page2 = "Page2";
const api1 = "API1";

const agHelper = ObjectsRegistry.AggregateHelper;
const ee = ObjectsRegistry.EntityExplorer;

describe("Canvas context Property Pane", function() {
  before(() => {
    cy.addDsl(dsl);
    cy.Createpage(page2);
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
    ee.SelectEntityByName(page1, "Pages");
    cy.CreateAPI(api1);
    cy.get(".t--close-editor").click();
    cy.get(".t--back-button").click();
  });

  beforeEach(() => {
    agHelper.RefreshPage();
  });

  it("Code Editor should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = ".t--property-control-label";
    verifyPropertyPaneContext(
      () => {
        cy.focusCodeInput(propertyControlSelector);
      },
      () => {
        cy.assertCursorOnCodeInput(propertyControlSelector);
      },
    );
  });

  it("Action Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector =
      ".t--property-control-onclick .t--open-dropdown-Select-Action";
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
    );
  });

  it("Toggle Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = `.t--property-control-animateloading input[type="checkbox"]`;
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
    );
  });

  it("DropDown Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlClickSelector = `.t--property-control-googlerecaptchaversion div:nth-child(2) .bp3-popover-target div`;
    const propertyControlVerifySelector =
      ".t--property-control-googlerecaptchaversion .ur--has-border";

    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlClickSelector)
          .eq(0)
          .click({ force: true });
      },
      () => {
        cy.get(propertyControlVerifySelector).should("be.focused");
      },
    );
  });

  it("Icon Button Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlClickSelector = `.t--property-control-borderradius div[aria-selected="true"]`;
    const propertyControlVerifySelector = `.t--property-control-borderradius div[role="tablist"]`;
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlClickSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlVerifySelector).should("be.focused");
      },
      true,
    );
  });

  it("ColorPicker Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = `.t--property-control-buttoncolor input[type="text"]`;
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
      true,
    );
  });

  it("Property Sections should retain state while switching between widgets, pages and Editor Panes", function() {
    const propertySectionState = {
      basic: false,
      general: true,
      validation: false,
      formsettings: true,
    };

    verifyPropertyPaneContext(
      () => {
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        verifyPropertyPaneSectionState(propertySectionState);
      },
    );
  });

  it("Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", function() {
    const propertySectionState = {
      general: true,
      icon: false,
      color: true,
      borderandshadow: false,
    };

    verifyPropertyPaneContext(
      () => {
        cy.get(`.tab-title:contains("STYLE")`)
          .eq(0)
          .click();
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        verifyPropertyPaneSectionState(propertySectionState);
      },
    );
  });
});

const propertySectionClass = (section) =>
  `.t--property-pane-section-collapse-${section}`;

function setPropertyPaneSectionState(propertySectionState) {
  for (const [sectionName, shouldSectionOpen] of Object.entries(
    propertySectionState,
  )) {
    cy.get("body").then(($body) => {
      if (
        $body.find(`${propertySectionClass(sectionName)} a[name="arrow-down"]`)
          .length >
          0 !==
        shouldSectionOpen
      ) {
        cy.get(propertySectionClass(sectionName)).click();
      }
    });
  }
}

function verifyPropertyPaneSectionState(propertySectionState) {
  for (const [sectionName, shouldSectionOpen] of Object.entries(
    propertySectionState,
  )) {
    cy.get("body").then(($body) => {
      const isSectionOpen =
        $body.find(`${propertySectionClass(sectionName)} a[name="arrow-down"]`)
          .length > 0;
      expect(isSectionOpen).to.equal(shouldSectionOpen);
    });
  }
}

function verifyPropertyPaneContext(
  focusCallback,
  assertCallback,
  isStyleTab = false,
) {
  //select Button1 widget in page1
  ee.SelectEntityByName("Button1", "Widgets");

  //verify the Button1 is selected in page1
  cy.get(".t--property-pane-title").should("contain", "Button1");

  if (isStyleTab) {
    cy.get(`.tab-title:contains("STYLE")`)
      .eq(0)
      .click();
  }

  //Focus Callback
  focusCallback();

  //Select Camera1 widget
  ee.SelectEntityByName("Camera1", "Widgets");
  cy.get(".t--property-pane-title").should("contain", "Camera1");

  //Switch back to Button1 widget
  ee.SelectEntityByName("Button1", "Widgets");

  //assert Callback
  assertCallback();

  //switch to page2 and back
  ee.SelectEntityByName(page2, "Pages");
  ee.SelectEntityByName("Text1", "Widgets");
  cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
  ee.SelectEntityByName(page1, "Pages");
  cy.wait(500);

  //assert Callback
  assertCallback();

  //Navigate to API1 Pane and back
  ee.SelectEntityByName(api1, "Queries/JS");
  cy.get(".t--close-editor").click();
  cy.wait(500);

  //assert Callback
  assertCallback();
}
