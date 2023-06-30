const simpleListWithInputAndButtonDSL = require("../../../../../fixtures/Listv2/simpleListWithInputAndButton.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;
const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
let agHelper = ObjectsRegistry.AggregateHelper;

const LOAD_TIMEOUT = 10000;

const listData = [
  {
    id: "000",
    name: "Yellow",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "001",
    name: "Blue",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "002",
    name: "Green",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "003",
    name: "Red",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "004",
    name: "Black",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "005",
    name: "Yellow",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "006",
    name: "Indigo",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
];

describe("Listv2 - Event bindings", () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. simple list widget should have access to currentItem, currentIndex and currentView", () => {
    cy.addDsl(simpleListWithInputAndButtonDSL);
    cy.wait(4000);
    // Open the property pane of button in the inner list widget
    cy.openPropertyPane("buttonwidget");

    // Enter text in the parent list widget's text input
    cy.get(widgetSelector("Input1"))
      .find("input")
      .type("Input", { force: true });

    // click the button on inner list 1st row.
    cy.get(widgetSelector("Button1")).find("button").click({ force: true });

    cy.get(commonlocators.toastmsg).contains("Input _ 000 _ 0");

    /**
     *  update value of currentView
     */

    // Enter text in the parent list widget's text input
    cy.get(widgetSelector("Input1"))
      .find("input")
      .clear()
      .type("Updated Input");

    // click the button on inner list 1st row.
    cy.get(widgetSelector("Button1")).find("button").click({ force: true });

    cy.wait(1000);

    cy.get(commonlocators.toastmsg).contains("Updated Input _ 000 _ 0");
  });

  it("2. widget events should get defined using action selector", () => {
    cy.addDsl(simpleListWithInputAndButtonDSL);
    cy.wait(2000);

    // wait for list widget to load
    cy.get(".t--widget-listwidgetv2", { timeout: LOAD_TIMEOUT });
    // Wait for List widget to load other items
    cy.get(".t--widget-buttonwidget", { timeout: LOAD_TIMEOUT }).should(
      "have.length.at.least",
      2,
    );

    cy.openPropertyPane("buttonwidget");

    // Clear the onClick event binding
    cy.testJsonTextClearMultiline("onclick");
    // Disable the JS mode
    cy.get(toggleJSButton("onclick")).click({ force: true });

    // Define action
    cy.addAction("{{currentItem.name}}", "onClick");
    cy.wait(2000);

    // Find the button and click
    cy.get(widgetSelector("Button1")).find("button").click({ force: true });

    // Verify alert
    cy.get(commonlocators.toastmsg).contains(listData[0].name);
  });
});
