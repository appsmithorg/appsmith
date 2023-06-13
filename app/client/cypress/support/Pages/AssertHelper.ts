import "cypress-wait-until";
import { ObjectsRegistry } from "../Objects/Registry";
import { ReusableHelper } from "../Objects/ReusableHelper";

export enum EntityItems {
  Page,
  Query,
  Api,
  JSObject,
  Widget,
  Datasource,
}
export class AssertHelper extends ReusableHelper {
  private locator = ObjectsRegistry.CommonLocators;
  public _modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  public isMac = Cypress.platform === "darwin";

  public Sleep(timeout = 1000) {
    cy.wait(timeout);
  }

  public AssertDocumentReady() {
    cy.waitUntil(() =>
      //cy.document().then((doc) => doc.readyState === "complete"),
      cy.document().should((doc) => {
        expect(doc.readyState).to.equal("complete");
      }),
    );
    cy.window().should("have.property", "onload");
  }

  public AssertDelete(entityType: EntityItems) {
    let networkCall = "";
    switch (entityType) {
      case EntityItems.Api:
      case EntityItems.Query:
        networkCall = "deleteAction";
        break;
      case EntityItems.Widget:
        networkCall = "updateLayout";
        break;
      case EntityItems.JSObject:
        networkCall = "deleteJSCollection";
        this.AssertContains("deleted successfully");
        break;
      case EntityItems.Datasource:
        networkCall = "deleteDatasource";
        break;
      case EntityItems.Page:
        networkCall = "deletePage";
        break;

      default:
        networkCall && this.AssertNetworkStatus(networkCall);
    }
  }

  public AssertNetworkStatus(aliasName: string, expectedStatus = 200) {
    // cy.wait(aliasName).then(($apiCall: any) => {
    //   expect($apiCall.response.body.responseMeta.status).to.eq(expectedStatus);
    // });

    // cy.wait(aliasName).should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   expectedStatus,
    // );
    this.Sleep(); //Wait a bit for call to finish!
    aliasName = aliasName.startsWith("@") ? aliasName : "@" + aliasName;
    cy.wait(aliasName);
    cy.get(aliasName)
      .its("response.body.responseMeta.status")
      .should("eq", expectedStatus);

    //To improve below:
    // cy.wait(aliasName, { timeout: timeout }).should((response: any) => {
    //   expect(response.status).to.be.oneOf([expectedStatus]);
    // });
  }

  public AssertContains(
    text: string | RegExp,
    exists: "exist" | "not.exist" | "be.visible" = "exist",
    selector?: string,
  ) {
    if (selector) {
      return cy.contains(selector, text).should(exists);
    }
    return cy.contains(text).should(exists);
  }
}
