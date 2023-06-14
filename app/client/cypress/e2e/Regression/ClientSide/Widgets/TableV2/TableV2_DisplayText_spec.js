const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { table } from "../../../../../support/Objects/ObjectsCore";
const publish = require("../../../../../locators/publishWidgetspage.json");

const propPane = ObjectsRegistry.PropertyPane;
const data = [
  {
    name: "C.COM",
  },
  {
    name: "B.COM",
  },
  {
    name: "A.COM",
  },
];

describe("Table V2 sort & filter using display text functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. should search and filter data using display text for URL", () => {
    cy.openPropertyPane("tablewidgetv2");
    propPane.UpdatePropertyFieldValue("Table data", JSON.stringify(data));
    cy.wait("@updateLayout");
    cy.wait(1000);
    _.propPane.ToggleOnOrOff("clientsidesearch", "On");
    cy.wait(2000);
    const colSettings = table._columnSettingsV2("name");
    _.agHelper.GetNClick(colSettings);
    cy.changeColumnType("URL");
    cy.testJsontext("displaytext", "{{['X','Y','Z'][currentIndex]}}");
    cy.get(publish.searchInput).first().type("X");
  });
});
