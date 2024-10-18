import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

let propertyControlSelector, propertySectionState;
const page1 = "Page1";
const page2 = "Page2";
const api1 = "API1";

describe("Canvas context Property Pane", { tags: ["@tag.IDE", "@tag.PropertyPane"] }, function () {
  before(() => {
    _.agHelper.AddDsl("editorContextdsl");
    PageList.AddNewPage("New blank page");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 200 });
    EditorNavigation.SelectEntityByName(page1, EntityType.Page);
    _.apiPage.CreateApi(api1);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
  });

  beforeEach(() => {
    _.agHelper.RefreshPage();
  });

  let propPaneBack = "[data-testid='t--property-pane-back-btn']";

  it("1. Layered PropertyPane - Property Sections should retain state while switching between widgets, pages and Editor Panes", () => {
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

  it("2. Layered PropertyPane - Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", () => {
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

  it("3. Multi Layered PropertyPane - Code Editor should have focus while switching between widgets, pages and Editor Panes", function () {
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

  it("4. Multi Layered PropertyPane - Toggle Property controls should have focus while switching between widgets, pages and Editor Panes", () => {
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
    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("5. Multi Layered PropertyPane - Property Sections should retain state while switching between widgets, pages and Editor Panes", () => {
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

    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "status");

    cy.wait(500);
    cy.get(propPaneBack).click();
    cy.get(".t--property-pane-title").should("contain", "Table1");
  });

  it("6. Multi Layered PropertyPane - Property Tabs and Sections should retain state while switching between widgets, pages and Editor Panes", () => {
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

    cy.wait(500);
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
        $body.find(`${propertySectionClass(sectionName)} .t--chevron-icon`)
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
    cy.get(`${propertySectionClass(sectionName)}`)
      .siblings(_.locators._propertyCollapse)
      .find(_.locators._propertyCollapseBody)
      .invoke("attr", "aria-hidden")
      .then((isSectionOpen) => {
        const expectedValue = shouldSectionOpen ? "false" : "true";
        expect(isSectionOpen).to.equal(expectedValue);
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
  EditorNavigation.SelectEntityByName(widgetName, EntityType.Widget);

  //verify the Button1 is selected in page1
  cy.get(".t--property-pane-title").should("contain", widgetName);

  if (isStyleTab) {
    cy.get(`.ads-v2-tabs__list-tab:contains("Style")`).eq(0).click();
  }

  //Focus Callback
  focusCallback();

  //Select Camera1 widget
  EditorNavigation.SelectEntityByName("Camera1", EntityType.Widget);
  cy.get(".t--property-pane-title").should("contain", "Camera1");

  //Switch back to Button1 widget
  EditorNavigation.SelectEntityByName(widgetName, EntityType.Widget);
  cy.wait(500);

  //assert Callback
  assertCallback();

  //switch to page2 and back
  EditorNavigation.SelectEntityByName(page2, EntityType.Page);
  EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
  cy.get(`div[data-testid='t--selected']`).should("have.length", 1);
  EditorNavigation.SelectEntityByName(page1, EntityType.Page);
  cy.wait(500);

  //assert Callback
  assertCallback();

  //Navigate to API1 Pane and back
  EditorNavigation.SelectEntityByName(api1, EntityType.Api);
  EditorNavigation.ShowCanvas();
  cy.wait(500);

  //assert Callback
  assertCallback();
}
