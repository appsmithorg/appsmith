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
  it.only("new Remove", function () {
    cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    cy.wait(5000);
    _.AggregateHelper.Sleep();
     //comment
    cy.signUp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
     //comment
    agHelper.Sleep(500);
     //comment
    cy.Logout(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
    _.agHelper.Sleep();
     //comment

    this.Sleep()

    this.Sleep(3000)
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
    cy.xpath("//div[@id='testing']"); //comment
  });

 

  it("new test cases", function () {
    agHelper.Sleep(500);
    //comment
    cy.LoginUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
     //comment
    cy.wait(5000);
     //comment
    this.Sleep(3000)
     //comment
    _.AggregateHelper.Sleep();
     //comment
    cy.signUp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
     //comment
    cy.Logout(Cypress.env("USERNAME"), Cypress.env("PASSWORD"), false);
     //comment
    _.agHelper.Sleep();
    this.Sleep()
   
  });
  
  
});