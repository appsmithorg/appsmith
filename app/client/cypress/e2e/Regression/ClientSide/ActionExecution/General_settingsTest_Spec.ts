import {
  agHelper,
  deployMode,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe("removeValue", { tags: ["@tag.notcovered"] }, () => {
  const dataDiv =  "div[id='testing']";

  before(() => {
    console.log("before");
  });
  beforeEach(() => {
    console.log("before each");
  });

  after(() => {
    console.log("after");
  });
  afterEach(() => {
    console.log("after each");
  });

  it("Remove", function () {
    cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    cy.pause();
    cy.wait(5000);
    cy.xpath("//div[@id='testing']");
    cy.get("div[id='testing']");
    cy.get(".btn.submit");
    cy.get(".div.span");
    cy.get("button[type=submit]");
    expect(true).to.be.equal(false);
    cy.get("input[type=input]").type("testing str");
    cy.get("input[type=input]").type(dataDiv);
    this.agHelper.Sleep();
    this.agHelper.Sleep(2000);
    _.AggregateHelper.Sleep();
    agHelper.Sleep(500);
    _.agHelper.Sleep();
    this.Sleep()
    this.Sleep(3000)
  });

  it.only("Remove", function () {
    cy.wait(5000);
    cy.xpath("//div[@id='testing']");
  });

  it.only("new Remove", function () {
    cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    cy.wait(5000);
    _.AggregateHelper.Sleep();
    cy.signUp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    agHelper.Sleep(500);
    cy.Logout(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    _.agHelper.Sleep();

    this.Sleep()

    this.Sleep(3000)
  });

  it.only("new test cases", function () {
    agHelper.Sleep(500);
    cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    cy.wait(5000);
    this.Sleep(3000)
    _.AggregateHelper.Sleep();
    cy.signUp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    
    cy.Logout(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    _.agHelper.Sleep();
    this.Sleep()
   
  });
  
  
});