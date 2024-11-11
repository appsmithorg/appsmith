const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

const data = [
  {
    id: "001",
    name: "Blue",
    img: "http://host.docker.internal:4200/clouddefaultImage.png",
  },
  {
    id: "002",
    name: "Green",
    img: "http://host.docker.internal:4200/clouddefaultImage.png",
  },
  {
    id: "003",
    name: "Red",
    img: "http://host.docker.internal:4200/clouddefaultImage.png",
  },
  {
    id: "004",
    name: "Yellow",
    img: "http://host.docker.internal:4200/clouddefaultImage.png",
  },
  {
    id: "005",
    name: "Orange",
    img: "http://host.docker.internal:4200/clouddefaultImage.png",
  },
  {
    id: "006",
    name: "Indigo",
    img: "http://host.docker.internal:4200/clouddefaultImage.png",
  },
];

describe(
  "List widget v2; TriggeredRow, SelectedRow",
  { tags: ["@tag.Widget", "@tag.List"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("Listv2/ListWithInputForSelectedAndTriggerRow");
    });

    it("1. Setup necessary data and widgets", () => {
      cy.openPropertyPane("listwidgetv2");

      cy.wait("@updateLayout");

      // Update widgets with right data and confirm
      cy.openPropertyPaneByWidgetName("TriggeredRow", "textwidget");
      cy.testJsontext("text", `{{List1.triggeredItemView}}`);
      cy.get(
        `${widgetSelector("TriggeredRow")} ${commonlocators.bodyTextStyle}`,
      )
        .first()
        .should("have.text", JSON.stringify({}));

      cy.openPropertyPaneByWidgetName("SelectedRow", "textwidget");
      cy.testJsontext("text", `{{List1.selectedItemView}}`);
      cy.get(`${widgetSelector("SelectedRow")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", JSON.stringify({}));

      cy.openPropertyPaneByWidgetName("SelectedItem", "textwidget");
      cy.testJsontext("text", `{{List1.selectedItem}}`);
      cy.get(
        `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
      )
        .first()
        .should("not.have.text");

      cy.openPropertyPaneByWidgetName("PageNumber", "textwidget");
      cy.testJsontext("text", `{{List1.pageNo}}`);
      cy.get(`${widgetSelector("PageNumber")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "1");

      cy.openPropertyPaneByWidgetName("PageSize", "textwidget");
      cy.testJsontext("text", `{{List1.pageSize}}`);

      cy.get(`${widgetSelector("PageSize")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "1");
    });

    it("2. Select a row and validate data", () => {
      // Select the First Row in Page 1
      cy.get(widgetSelector("List1"))
        .find(containerWidgetSelector)
        .first()
        .click({ force: true });

      cy.wait(500);

      // Confirm and validate data in a ll widgets
      cy.get(
        `${widgetSelector("TriggeredRow")} ${commonlocators.bodyTextStyle}`,
      )
        .first()
        .then((val) => {
          const data = JSON.parse(val.text());
          const triggeredItemView = {
            Image1: {
              image: "http://host.docker.internal:4200/clouddefaultImage.png",
              isVisible: true,
            },
            Text1: {
              isVisible: true,
              text: "Blue",
            },
            Text2: {
              isVisible: true,
              text: "001",
            },
            Input1: {
              text: "",
              isValid: true,
              isVisible: true,
              isDisabled: false,
            },
            Button1: {
              isVisible: true,
              text: "Submit",
              isDisabled: false,
            },
          };
          cy.wrap(data).should("deep.equal", triggeredItemView);
        });

      cy.get(`${widgetSelector("SelectedRow")} ${commonlocators.bodyTextStyle}`)
        .first()
        .then((val) => {
          const data = JSON.parse(val.text());
          const SelectedRow = {
            Image1: {
              image: "http://host.docker.internal:4200/clouddefaultImage.png",
              isVisible: true,
            },
            Text1: {
              isVisible: true,
              text: "Blue",
            },
            Text2: {
              isVisible: true,
              text: "001",
            },
            Input1: {
              text: "",
              isValid: true,
              isVisible: true,
              isDisabled: false,
            },
            Button1: {
              isVisible: true,
              text: "Submit",
              isDisabled: false,
            },
          };
          cy.wrap(data).should("deep.equal", SelectedRow);
        });

      cy.get(
        `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
      )
        .first()
        .then((el) => {
          const val = JSON.parse(el.text());

          const emptyRow = data[0];
          cy.wrap(val).should("deep.equal", emptyRow);
        });

      cy.get(`${widgetSelector("PageNumber")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "1");

      cy.get(`${widgetSelector("PageSize")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "1");
    });

    it("3. Change Page and validate data", () => {
      // Go to Page 2
      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });

      // Validate data doesn't change on Page Change in a widgets
      cy.get(
        `${widgetSelector("TriggeredRow")} ${commonlocators.bodyTextStyle}`,
      )
        .first()
        .then((val) => {
          const data = JSON.parse(val.text());
          const triggeredItemView = {
            Image1: {
              image: "http://host.docker.internal:4200/clouddefaultImage.png",
              isVisible: true,
            },
            Text1: {
              isVisible: true,
              text: "Blue",
            },
            Text2: {
              isVisible: true,
              text: "001",
            },
            Input1: {
              text: "",
              isValid: true,
              isVisible: true,
              isDisabled: false,
            },
            Button1: {
              isVisible: true,
              text: "Submit",
              isDisabled: false,
            },
          };
          cy.wrap(data).should("deep.equal", triggeredItemView);
        });

      cy.get(`${widgetSelector("SelectedRow")} ${commonlocators.bodyTextStyle}`)
        .first()
        .then((val) => {
          const data = JSON.parse(val.text());
          const selectedItemView = {
            Image1: {
              image: "http://host.docker.internal:4200/clouddefaultImage.png",
              isVisible: true,
            },
            Text1: {
              isVisible: true,
              text: "Blue",
            },
            Text2: {
              isVisible: true,
              text: "001",
            },
            Input1: {
              text: "",
              isValid: true,
              isVisible: true,
              isDisabled: false,
            },
            Button1: {
              isVisible: true,
              text: "Submit",
              isDisabled: false,
            },
          };
          cy.wrap(data).should("deep.equal", selectedItemView);
        });

      cy.get(
        `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
      )
        .first()
        .then((el) => {
          const val = JSON.parse(el.text());

          const emptyRow = data[0];
          cy.wrap(val).should("deep.equal", emptyRow);
        });

      cy.get(`${widgetSelector("PageNumber")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "2");

      cy.get(`${widgetSelector("PageSize")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "1");
    });

    it("4. Have a different triggeredItemView and selectedItemView and validate data on PageChange", () => {
      // Go to page 3
      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });

      // Validate Page Number
      cy.get(`${widgetSelector("PageNumber")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "3");

      // Click on a button to change triggeredItemView
      cy.get(
        `${widgetSelector("List1")} ${containerWidgetSelector} .bp3-button`,
      )
        .first()
        .click({ force: true });

      // Goto page 4
      cy.get(commonlocators.listPaginateNextButton).click({
        force: true,
      });

      // Validate Page Number
      cy.get(`${widgetSelector("PageNumber")} ${commonlocators.bodyTextStyle}`)
        .first()
        .should("have.text", "4");

      // Validate TriggeredRow changed to data in page 3 and didn't change in Page 4
      cy.get(
        `${widgetSelector("TriggeredRow")} ${commonlocators.bodyTextStyle}`,
      )
        .first()
        .then((val) => {
          const data = JSON.parse(val.text());
          const triggeredItemView = {
            Image1: {
              image: "http://host.docker.internal:4200/clouddefaultImage.png",
              isVisible: true,
            },
            Text1: {
              isVisible: true,
              text: "Red",
            },
            Text2: {
              isVisible: true,
              text: "003",
            },
            Input1: {
              text: "",
              isValid: true,
              isVisible: true,
              isDisabled: false,
            },
            Button1: {
              isVisible: true,
              text: "Submit",
              isDisabled: false,
            },
          };
          cy.wrap(data).should("deep.equal", triggeredItemView);
        });
    });

    // TODO: (Tolulope) Add a test for infinite scroll once it's ready to be shipped
  },
);
