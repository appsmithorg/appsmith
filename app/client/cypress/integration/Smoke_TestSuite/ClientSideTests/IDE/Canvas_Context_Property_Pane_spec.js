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

  it("1. Code Editor should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = ".t--property-control-label";
    verifyPropertyPaneContext(
      () => {
        cy.focusCodeInput(propertyControlSelector);
      },
      () => {
        cy.assertSoftFocusOnCodeInput(propertyControlSelector);
      },
      "Button1",
    );
  });

  it("2. Action Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector =
      ".t--property-control-onclick .t--open-dropdown-Select-Action";
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
      "Button1",
    );
  });

  it("3. Toggle Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = `.t--property-control-animateloading input[type="checkbox"]`;
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
      "Button1",
    );
  });

  it("4. DropDown Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
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
      "Button1",
    );
  });

  it("5. Icon Button Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlClickSelector = `.t--property-control-borderradius div[aria-selected="true"]`;
    const propertyControlVerifySelector = `.t--property-control-borderradius div[role="tablist"]`;
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlClickSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlVerifySelector).should("be.focused");
      },
      "Button1",
      true,
    );
  });

  it("6. ColorPicker Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = `.t--property-control-buttoncolor input[type="text"]`;
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
      "Button1",
      true,
    );
  });

  it("7. Property Sections should retain state while switching between widgets, pages and Editor Panes", function() {
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
      "Button1",
    );
  });

  it("8. Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", function() {
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
      "Button1",
    );
  });

  it("9. Layered PropertyPane - Code Editor should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = ".t--property-control-computedvalue";
    verifyPropertyPaneContext(
      () => {
        cy.editColumn("step");
        cy.focusCodeInput(propertyControlSelector);
      },
      () => {
        cy.assertSoftFocusOnCodeInput(propertyControlSelector);
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("10. Layered PropertyPane - Toggle Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = `.t--property-control-cellwrapping input[type="checkbox"]`;
    verifyPropertyPaneContext(
      () => {
        cy.editColumn("step");
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("11. Layered PropertyPane - Property Sections should retain state while switching between widgets, pages and Editor Panes", function() {
    const propertySectionState = {
      data: false,
      general: true,
    };

    verifyPropertyPaneContext(
      () => {
        cy.editColumn("step");
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        cy.wait(500);
        verifyPropertyPaneSectionState(propertySectionState);
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("12. Layered PropertyPane - Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", function() {
    const propertySectionState = {
      textformatting: true,
      color: false,
    };

    verifyPropertyPaneContext(
      () => {
        cy.editColumn("step");
        cy.get(`.tab-title:contains("STYLE")`)
          .eq(0)
          .click();
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        verifyPropertyPaneSectionState(propertySectionState);
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("13. Multi Layered PropertyPane - Code Editor should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = ".t--property-control-text";
    verifyPropertyPaneContext(
      () => {
        cy.editColumn("status");
        cy.editColumn("menuIteme63irwbvnd", false);
        cy.focusCodeInput(propertyControlSelector);
      },
      () => {
        cy.assertSoftFocusOnCodeInput(propertyControlSelector);
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("14. Multi Layered PropertyPane - Toggle Property controls should have focus while switching between widgets, pages and Editor Panes", function() {
    const propertyControlSelector = `.t--property-control-visible input[type="checkbox"]`;
    verifyPropertyPaneContext(
      () => {
        cy.editColumn("status");
        cy.editColumn("menuIteme63irwbvnd", false);
        cy.get(propertyControlSelector).click({ force: true });
      },
      () => {
        cy.get(propertyControlSelector).should("be.focused");
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("15. Multi Layered PropertyPane - Property Sections should retain state while switching between widgets, pages and Editor Panes", function() {
    const propertySectionState = {
      basic: false,
      general: true,
    };

    verifyPropertyPaneContext(
      () => {
        cy.editColumn("status");
        cy.editColumn("menuIteme63irwbvnd", false);
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        cy.wait(500);
        verifyPropertyPaneSectionState(propertySectionState);
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("16. Multi Layered PropertyPane - Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", function() {
    const propertySectionState = {
      icon: true,
      color: false,
    };

    verifyPropertyPaneContext(
      () => {
        cy.editColumn("status");
        cy.editColumn("menuIteme63irwbvnd", false);
        cy.get(`.tab-title:contains("STYLE")`)
          .eq(0)
          .click();
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        verifyPropertyPaneSectionState(propertySectionState);
      },
      "Table1",
    );

    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(".t--property-pane-back-btn").click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
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
  widgetName,
  isStyleTab = false,
) {
  //select Button1 widget in page1
  ee.SelectEntityByName(widgetName, "Widgets");

  //verify the Button1 is selected in page1
  cy.get(".t--property-pane-title").should("contain", widgetName);

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
  ee.SelectEntityByName(widgetName, "Widgets");
  cy.wait(500);

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
