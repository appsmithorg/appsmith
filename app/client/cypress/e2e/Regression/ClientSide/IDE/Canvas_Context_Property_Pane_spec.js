import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dsl = require("../../../../fixtures/editorContextdsl.json");
let propertyControlSelector,
  propertyControlClickSelector,
  propertyControlVerifySelector,
  propertySectionState;
const page1 = "Page1";
const page2 = "Page2";
const api1 = "API1";

const agHelper = ObjectsRegistry.AggregateHelper;
const ee = ObjectsRegistry.EntityExplorer;
const apiPage = ObjectsRegistry.ApiPage;

describe("Canvas context Property Pane", function () {
  before(() => {
    cy.addDsl(dsl);
    ee.AddNewPage("New blank page");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
    ee.SelectEntityByName(page1, "Pages");
    apiPage.CreateApi(api1);
    ee.NavigateToSwitcher("Widgets");
  });

  beforeEach(() => {
    agHelper.RefreshPage();
  });

  let propPaneBack = "[data-testid='t--property-pane-back-btn']";

  it("1. Code Editor should have focus while switching between widgets, pages and Editor Panes - Label", function () {
    propertyControlSelector = ".t--property-control-label";
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

  it("2. Code Editor should have focus while switching between widgets, pages and Editor Panes", function () {
    propertyControlSelector = `.t--property-control-animateloading input[type="checkbox"]`;
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

  it(
    "excludeForAirgap",
    "3. Code Editor should have focus while switching between widgets, pages and Editor Panes",
    function () {
      // TODO: Since google recaptcha is not possible in airgap mode, skipping this test for now for airgapped version.
      //Will modify the dsl to have maybe phone input widget to have a dropdown property control - Sangeeth
      //if (!Cypress.env("AIRGAPPED")) {
      //DropDown Property controls should have focus while switching between widgets, pages and Editor Panes
      agHelper.RefreshPage();
      propertyControlClickSelector = `.t--property-control-googlerecaptchaversion .rc-select-selection-search-input`;
      propertyControlVerifySelector =
        ".t--property-control-googlerecaptchaversion .rc-select-selection-search-input";

      verifyPropertyPaneContext(
        () => {
          cy.get(propertyControlClickSelector).eq(0).click({ force: true });
        },
        () => {
          cy.get(propertyControlVerifySelector).should("be.focused");
        },
        "Button1",
      );
      //}
    },
  );

  it("4. Code Editor should have focus while switching between widgets, pages and Editor Panes", function () {
    //Icon Button Property controls should have focus while switching between widgets, pages and Editor Panes
    propertyControlClickSelector = `.t--property-control-borderradius .ads-v2-segmented-control__segments-container`;
    propertyControlVerifySelector = `.t--property-control-borderradius .ads-v2-segmented-control__segments-container[data-selected="true"]`;
    verifyPropertyPaneContext(
      () => {
        cy.get(propertyControlClickSelector).eq(0).click({ force: true });
      },
      () => {
        cy.get(propertyControlVerifySelector).should("be.focused");
      },
      "Button1",
      true,
    );
  });

  it("5. ColorPicker Property controls should have focus while switching between widgets, pages and Editor Panes", function () {
    let propertyControlSelector = `.t--property-control-buttoncolor input[type="text"]`;
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

  it("6. ColorPicker Property controls should have focus while switching between widgets, pages and Editor Panes", function () {
    propertySectionState = {
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

  it("7. ColorPicker Property controls should have focus while switching between widgets, pages and Editor Panes", function () {
    propertySectionState = {
      general: true,
      icon: false,
      color: true,
      borderandshadow: false,
    };

    verifyPropertyPaneContext(
      () => {
        cy.get(`.ads-v2-tabs__list-tab:contains("Style")`).eq(0).click();
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        verifyPropertyPaneSectionState(propertySectionState);
      },
      "Button1",
    );
  });

  it("8. Layered PropertyPane - Code Editor should have focus while switching between widgets, pages and Editor Panes", function () {
    propertyControlSelector = ".t--property-control-computedvalue";
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

    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("9. Layered PropertyPane - Toggle Property controls should have focus while switching between widgets, pages and Editor Panes", function () {
    let propertyControlSelector = `.t--property-control-cellwrapping input[type="checkbox"]`;
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

    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("10. Layered PropertyPane - Property Sections should retain state while switching between widgets, pages and Editor Panes", () => {
    let propertySectionState = {
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
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("11. Layered PropertyPane - Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", () => {
    propertySectionState = {
      textformatting: true,
      color: false,
    };

    verifyPropertyPaneContext(
      () => {
        cy.editColumn("step");
        cy.get(`.ads-v2-tabs__list-tab:contains("Style")`).eq(0).click();
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        verifyPropertyPaneSectionState(propertySectionState);
      },
      "Table1",
    );

    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("12. Multi Layered PropertyPane - Code Editor should have focus while switching between widgets, pages and Editor Panes", function () {
    let propertyControlSelector = ".t--property-control-text";
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

    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("13. Multi Layered PropertyPane - Toggle Property controls should have focus while switching between widgets, pages and Editor Panes", () => {
    propertyControlSelector = `.t--property-control-visible input[type="checkbox"]`;
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

    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("14. Multi Layered PropertyPane - Property Sections should retain state while switching between widgets, pages and Editor Panes", () => {
    let propertySectionState = {
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

    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("15. Multi Layered PropertyPane - Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", () => {
    propertySectionState = {
      icon: true,
      color: false,
    };

    verifyPropertyPaneContext(
      () => {
        cy.editColumn("status");
        cy.editColumn("menuIteme63irwbvnd", false);
        cy.get(`.ads-v2-tabs__list-tab:contains("Style")`).eq(0).click();
        setPropertyPaneSectionState(propertySectionState);
      },
      () => {
        verifyPropertyPaneSectionState(propertySectionState);
      },
      "Table1",
    );

    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });
});

let propertySectionClass = (section) =>
  `.t--property-pane-section-collapse-${section}`;

function setPropertyPaneSectionState(propertySectionState) {
  for (const [sectionName, shouldSectionOpen] of Object.entries(
    propertySectionState,
  )) {
    cy.get("body").then(($body) => {
      if (
        $body.find(
          `${propertySectionClass(sectionName)} .t--chevron-icon.rotate-180`,
        ).length >
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
        $body.find(
          `${propertySectionClass(sectionName)} .t--chevron-icon.rotate-180`,
        ).length > 0;
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
    cy.get(`.ads-v2-tabs__list-tab:contains("Style")`).eq(0).click();
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
