import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

const listData = [
  {
    id: 10,
    name: "okbuddy",
  },
  {
    id: 11,
    name: "Aliess",
  },
  {
    id: 14,
    name: "Aliess123",
  },
  {
    id: 15,
    name: "Aliess",
  },
  {
    id: 16,
    name: "Aliess",
  },
  {
    id: 17,
    name: "Aliess",
  },
  {
    id: 18,
    name: "Aliess",
  },
  {
    id: 19,
    name: "Aliess",
  },
  {
    id: 20,
    name: "Jennie James",
  },
  {
    id: 21,
    name: "Aliess",
  },
  {
    id: 22,
    name: "Aliess",
  },
  {
    id: 23,
    name: "Aliess",
  },
  {
    id: 24,
    name: "Aliess",
  },
  {
    id: 25,
    name: "Aliess",
  },
  {
    id: 26,
    name: "Aliess",
  },
  {
    id: 27,
    name: "Aliess",
  },
  {
    id: 28,
    name: "Aliess",
  },
  {
    id: 29,
    name: "Aliess",
  },
  {
    id: 30,
    name: "Aliess",
  },
];

describe(
  "List widget V2 page number and page size",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Sanity", "@tag.Binding"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("listv2PaginationDsl");
    });

    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    it("1. List widget V2 with client side pagination", () => {
      cy.openPropertyPane("listwidgetv2");
      cy.testJsontext("items", JSON.stringify(listData));
      cy.wait("@updateLayout");
      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", `PageSize {{List1.pageSize}}`);
      cy.wait("@updateLayout");

      cy.get(commonlocators.bodyTextStyle)
        .first()
        .should("have.text", "PageSize 4");

      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", `Page Number {{List1.pageNo}}`);
      cy.wait("@updateLayout");
      cy.get(commonlocators.bodyTextStyle)
        .first()
        .should("have.text", "Page Number 1");

      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });
      cy.get(commonlocators.bodyTextStyle)
        .first()
        .should("have.text", "Page Number 2");

      cy.openPropertyPane("listwidgetv2");
      cy.get(commonlocators.deleteWidget).click({ force: true });
    });

    it("2. List widget V2 with server side pagination", () => {
      cy.dragAndDropToCanvas("listwidgetv2", {
        x: 300,
        y: 300,
      });
      cy.openPropertyPane("listwidgetv2");

      cy.openPropertyPane("textwidget");
      _.propPane.UpdatePropertyFieldValue(
        "Text",
        "PageSize {{List1.pageSize}}",
      );

      cy.get(commonlocators.bodyTextStyle)
        .first()
        .should("have.text", "PageSize 3");

      // toggle serversidepagination -> true
      cy.openPropertyPane("listwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.serverSidePaginationCheckbox);

      cy.get(commonlocators.bodyTextStyle)
        .first()
        .should("have.text", "PageSize 2");

      //should reset page no if higher than max when switched from server side to client side"
      // Open Datasource editor
      _.dataSources.CreateDataSource("Postgres");
      _.dataSources.CreateQueryAfterDSSaved();

      _.agHelper.RenameQuery("Query1");

      // switching off Use Prepared Statement toggle
      _.dataSources.ToggleUsePreparedStatement(false);

      _.dataSources.EnterQuery(
        "SELECT * FROM users OFFSET {{List1.pageNo * 1}} LIMIT {{List1.pageSize}};",
      );

      cy.WaitAutoSave();

      cy.runQuery();

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      // Click next page in list widget
      cy.get(".t--list-widget-next-page").find("button").click({ force: true });

      // Change to client side pagination
      cy.openPropertyPane("listwidgetv2");
      _.propPane.UpdatePropertyFieldValue("Items", "{{Query1.data}}");
      _.propPane.TogglePropertyState("Server side pagination", "Off");

      cy.get(".t--widget-containerwidget").should("have.length", 2);
    });
  },
);
