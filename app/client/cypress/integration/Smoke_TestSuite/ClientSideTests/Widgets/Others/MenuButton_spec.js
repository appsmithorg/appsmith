const dsl = require("../../../../../fixtures/menuButtonDsl.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const { modifierKey } = require("../../../../../support/Constants");

describe("Menu Button Widget Functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Icon alignment should not change when changing the icon", () => {
    cy.openPropertyPane("menubuttonwidget");
    cy.moveToStyleTab();
    // Add an icon
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-add")
      .first()
      .click({
        force: true,
      });
    // Assert if the icon exists
    cy.get(`${formWidgetsPage.menuButtonWidget} .bp3-icon-add`).should("exist");
    // Change its icon alignment to right
    cy.get(".t--property-control-position .t--button-tab-right")
      .last()
      .click({ force: true });
    cy.wait(200);
    // Assert if the icon appears on the right side of the button text
    cy.get(formWidgetsPage.menuButtonWidget)
      .contains("Open Menu")
      .children("span")
      .should("have.length", 2);
    cy.get(`${formWidgetsPage.menuButtonWidget} span.bp3-button-text`)
      .next()
      .should("have.class", "bp3-icon-add");
    // Change the existing icon
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-airplane")
      .first()
      .click({
        force: true,
      });
    // Assert if the icon changes
    // Assert if the icon still exists on the right side of the text
    cy.get(`${formWidgetsPage.menuButtonWidget} .bp3-icon-airplane`)
      .should("exist")
      .prev()
      .should("have.text", "Open Menu");
  });

  it("2. MenuButton widget functionality on undo after delete", function() {
    cy.openPropertyPane("menubuttonwidget");
    cy.moveToContentTab();
    // Delete Second Menu Item
    cy.get(".t--property-control-menuitems .t--delete-column-btn")
      .eq(1)
      .click({
        force: true,
      });

    // Click on the menu button
    cy.get(`${formWidgetsPage.menuButtonWidget} button`).click({
      force: true,
    });
    cy.wait(500);

    // Check first menu item
    cy.get(".bp3-menu-item")
      .eq(0)
      .contains("First Menu Item");
    // Check second menu item
    cy.get(".bp3-menu-item")
      .eq(1)
      .contains("Third Menu Item");

    // Undo
    cy.get("body").type(`{${modifierKey}}+z`);
    // Check first menu item
    cy.get(".bp3-menu-item")
      .eq(0)
      .contains("First Menu Item");
    // Check second menu item
    cy.get(".bp3-menu-item")
      .eq(1)
      .contains("Second Menu Item");
    // Check third menu item
    cy.get(".bp3-menu-item")
      .eq(2)
      .contains("Third Menu Item");

    // Navigate to property pane of Second Menu Item
    cy.get(".t--property-control-menuitems .t--edit-column-btn")
      .eq(1)
      .click({
        force: true,
      });
    cy.wait(1000);
    // Check the title
    cy.get(".t--property-pane-title").contains("Second Menu Item");
    // Navigate Back
    cy.get(".t--property-pane-back-btn").click();
  });

  it("3. MenuButton widget functionality to add dynamic menu items", function() {
    cy.openPropertyPane("menubuttonwidget");
    cy.moveToContentTab();

    // Select menu items source as Dynamic
    cy.get(commonlocators.menuButtonMenuItemsSource)
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains("Dynamic")
      .click();

    // Add sample source data
    cy.testJsontext(
      "sourcedata",
      JSON.stringify(this.data.MenuButtonSourceData),
    );

    // Open configure array item panel
    cy.get(commonlocators.menuButtonConfigureArrayItems).click({
      force: true,
    });

    // Update label binding
    cy.testJsontext("label", `{{currentItem.first_name}}`);
    cy.wait(1000);

    cy.closePropertyPane();

    // Check if a total of 3 menu items have been added
    cy.get(`${formWidgetsPage.menuButtonWidget} button`).click({
      force: true,
    });
    cy.wait(500);
    cy.get(".bp3-menu-item")
      .eq(0)
      .contains("Michael");
    cy.get(".bp3-menu-item")
      .eq(1)
      .contains("Lindsay");
    cy.get(".bp3-menu-item")
      .eq(2)
      .contains("Brock");
  });
});
