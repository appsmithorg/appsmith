import "cypress-wait-until";

export const EntityItems = {
  Page: 0,
  Query: 1,
  Api: 2,
  JSObject: 3,
  Widget: 4,
  Datasource: 5,
} as const;

export type EntityItemsType = (typeof EntityItems)[keyof typeof EntityItems];

export class AssertHelper {
  public _modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  public isMac = Cypress.platform === "darwin";

  public Sleep(timeout = 1000) {
    cy.wait(timeout);
  }

  public AssertDocumentReady() {
    this.waitForCondition(() =>
      cy.document().then((doc) => {
        return doc.readyState === "complete";
      }),
    );

    this.waitForCondition(() =>
      cy.window().then((win) => {
        return win.hasOwnProperty("onload");
      }),
    );
  }

  private waitForCondition(conditionFn: any) {
    cy.waitUntil(() => conditionFn, {
      timeout: Cypress.config("pageLoadTimeout"),
      interval: 1000,
    });
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

  public WaitForNetworkCall(aliasName: string, responseTimeout = 100000) {
    // cy.wait(aliasName).then(($apiCall: any) => {
    //   expect($apiCall.response.body.responseMeta.status).to.eq(expectedStatus);
    // });

    this.Sleep(); //wait a bit to avoid flaky tests
    return cy
      .wait(this.GetAliasName(aliasName), { timeout: responseTimeout })
      .then((interceptions) => {
        return cy
          .get(this.GetAliasName(aliasName), { timeout: responseTimeout })
          .its("response");
      });
  }

  public AssertNetworkStatus(
    aliasName: string,
    expectedStatus: number | number[] = 200,
    waitForNetworkCall = true,
  ) {
    if (waitForNetworkCall) {
      // If waitForNetworkCall is true, then use the response from WaitForNetworkCall call
      return this.WaitForNetworkCall(aliasName).then((response: any) =>
        this.processNetworkStatus(response, expectedStatus),
      );
    } else {
      // If interception is not available, directly get the alias & use it
      return cy
        .get(this.GetAliasName(aliasName))
        .its("response")
        .then((interception: any) =>
          this.processNetworkStatus(interception, expectedStatus),
        );
    }
  }

  private processNetworkStatus(
    response: any,
    expectedStatus: number | number[],
  ) {
    const responseStatus = Number(response.body.responseMeta.status);
    const expectedStatusArray = Array.isArray(expectedStatus)
      ? expectedStatus
      : [expectedStatus];

    expect(expectedStatusArray).to.include(responseStatus);
    return responseStatus;
  }

  public AssertNetworkResponseData(
    aliasName: string,
    waitForNetworkCall = true,
  ) {
    if (waitForNetworkCall) {
      // If waitForNetworkCall is true, then use the interception from received call
      this.WaitForNetworkCall(aliasName).then((interception: any) => {
        this.processNetworkResponseData(interception);
      });
    } else {
      // If interception is not available, directly get the alias & use it
      cy.get(this.GetAliasName(aliasName))
        .its("response")
        .then((interception: any) => {
          this.processNetworkResponseData(interception);
        });
    }
  }

  private processNetworkResponseData(response: any) {
    expect(response.body.data).to.not.be.empty;
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
