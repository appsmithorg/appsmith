const simpleListDSL = require("../../../../../fixtures/Listv2/simpleList.json");
const publishLocators = require("../../../../../locators/publishWidgetspage.json");

const simpleListData1 = [
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
];

describe("List widget v2 - Basic client side data tests", () => {
  before(() => {
    cy.addDsl(simpleListDSL);
  });

  it("1. shows correct number of items", () => {
    cy.get(publishLocators.containerWidget).should("have.length", 3);
    cy.get(publishLocators.imageWidget).should("have.length", 3);
    cy.get(publishLocators.textWidget).should("have.length", 6);
  });

  it("2. shows correct text from binding", () => {
    cy.get(publishLocators.containerWidget).each(($containerEl, index) => {
      cy.wrap($containerEl)
        .find(publishLocators.textWidget)
        .eq(0)
        .should("have.text", simpleListData1[index].name);
      cy.wrap($containerEl)
        .find(publishLocators.textWidget)
        .eq(1)
        .should("have.text", simpleListData1[index].id);
    });
  });
});
