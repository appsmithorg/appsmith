import "cypress-wait-until";
import { ObjectsRegistry } from "../Objects/Registry";
import { ReusableHelper } from "../Objects/ReusableHelper";

export const EntityItems = {
  Page: 0,
  Query: 1,
  Api: 2,
  JSObject: 3,
  Widget: 4,
  Datasource: 5,
} as const;

export type EntityItemsType = (typeof EntityItems)[keyof typeof EntityItems];

export class AssertHelper extends ReusableHelper {
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
    //cy.window({ timeout: 60000 }).should("have.property", "onload");//commenting to reduce time
  }

  public AssertDelete(entityType: EntityItemsType) {
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

  public GetAliasName(aliasName: string) {
    aliasName = aliasName.startsWith("@") ? aliasName : "@" + aliasName;
    return aliasName;
  }

  public WaitForNetworkCall(aliasName: string, responseTimeout = 60000) {
    // cy.wait(aliasName).then(($apiCall: any) => {
    //   expect($apiCall.response.body.responseMeta.status).to.eq(expectedStatus);
    // });

    // cy.wait(aliasName).should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   expectedStatus,
    // );
    this.Sleep(); //Wait a bit for call to finish!
    return cy.wait(this.GetAliasName(aliasName), { responseTimeout });
  }

  public AssertNetworkStatus(
    aliasName: string,
    expectedStatus: number | number[] = 200,
    waitForNetworkCall = true,
    timeout = 60000,
  ) {
    waitForNetworkCall && this.WaitForNetworkCall(aliasName, timeout);
    return cy.get(this.GetAliasName(aliasName)).then((interception: any) => {
      const responseStatus = Number(
        interception.response.body.responseMeta.status,
      );
      const expectedStatusArray = Array.isArray(expectedStatus)
        ? expectedStatus
        : [expectedStatus];

      expect(expectedStatusArray).to.include(responseStatus);
      return responseStatus;
    });
  }

  public AssertNetworkResponseData(
    aliasName: string,
    waitForNetworkCall = true,
  ) {
    waitForNetworkCall && this.WaitForNetworkCall(aliasName, 100000);
    cy.get(this.GetAliasName(aliasName))
      .its("response.body.data")
      .should("not.be.empty");
  }

  public AssertNetworkExecutionSuccess(
    aliasName: string,
    expectedRes = true,
    waitForNetworkCall = true,
  ) {
    waitForNetworkCall && this.WaitForNetworkCall(aliasName);
    cy.get(aliasName)
      .its("response.body.data.isExecutionSuccess")
      .should("eq", expectedRes);
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
