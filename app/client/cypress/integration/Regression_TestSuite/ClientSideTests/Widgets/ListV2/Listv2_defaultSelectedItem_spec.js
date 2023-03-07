const dsl = require("../../../../../fixtures/Listv2/Listv2DefaultSelectedItem.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

const items = JSON.parse(dsl.dsl.children[0].listData);
const querySelectedItem = {
  id: 553,
  gender: "female",
  latitude: "55",
  longitude: "33",
  dob: "2019-07-01T05:30:00Z",
  phone: "1 (234) 567-1",
  email: "1026033274@qq.com",
  image: "",
  country: "india",
  name: "test",
};
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

function testJsontextClear(endp) {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type(`{${modifierKey}}{a}`, { force: true })
    .type(`{${modifierKey}}{del}`, { force: true });
}

describe("List widget v2 defaultSelectedItem", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Loads the Page with the default Selected Item", () => {
    // Loads to page 2
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
    cy.get(`${widgetSelector("Text3")} ${commonlocators.bodyTextStyle}`).then(
      (val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", items[4]);
      },
    );

    //Change Default Selected Item
    cy.openPropertyPane("listwidgetv2");

    testJsontextClear("defaultselecteditem");
    cy.testJsontext("defaultselecteditem", "001");

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    cy.get(commonlocators.listPaginateActivePage).should("have.text", "1");
    cy.get(`${widgetSelector("Text3")} ${commonlocators.bodyTextStyle}`).then(
      (val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", items[0]);
      },
    );
  });

  it("2. use query data", () => {
    // Create sample(mock) user database.
    _.dataSources.CreateMockDB("Users").then((dbName) => {
      _.dataSources.CreateQueryFromActiveTab(dbName, false);
      _.agHelper.GetNClick(_.dataSources._templateMenu);
      _.dataSources.ToggleUsePreparedStatement(false);
      _.dataSources.EnterQuery("SELECT * FROM users ORDER BY id LIMIT 20;");
      _.dataSources.RunQuery();
    });
    _.entityExplorer.SelectEntityByName("Page1");

    cy.wait(200);
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );
    // cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
    // cy.get(`${widgetSelector("Text3")} ${commonlocators.bodyTextStyle}`).then(
    //   (val) => {
    //     const data = JSON.parse(val.text());
    //     cy.wrap(data).should("deep.equal", items[4]);
    //   },
    // );

    //Change Default Selected Item
    cy.openPropertyPane("listwidgetv2");

    testJsontextClear("items");
    cy.testJsontext("items", "{{Query1.data}}");

    testJsontextClear("defaultselecteditem");
    cy.testJsontext("defaultselecteditem", "553");

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    cy.get(commonlocators.listPaginateActivePage).should("have.text", "5");
    cy.get(`${widgetSelector("Text3")} ${commonlocators.bodyTextStyle}`).then(
      (val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", querySelectedItem);
      },
    );

    // In view Mode

    cy.PublishtheApp();

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    cy.get(commonlocators.listPaginateActivePage).should("have.text", "5");
    cy.get(`${widgetSelector("Text3")} ${commonlocators.bodyTextStyle}`).then(
      (val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", querySelectedItem);
      },
    );
  });
});
