import "cypress-wait-until";
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

  public AssertReduxLoad(actionType: string) {
    this.Sleep(500);
    const timeout = Cypress.config("pageLoadTimeout"); // Set your desired timeout value
    // const checkLoadingState = () => {
    //   return cy
    //     .window()
    //     .its("store")
    //     .invoke("getState")
    //     .then((state) => {
    //       const loadingStates = state.ui.editor.loadingStates;

    //       cy.wrap(loadingStates).should("deep.include", { loading: false });

    //       const actions = state.actions || [];
    //       const actionPromises = actions.map((action: any) => {
    //         return cy.wrap(action.isLoading).then((isLoading) => {
    //           expect(isLoading).to.eq(false);
    //         });
    //       });

    //       return Promise.all(actionPromises).then(() => {
    //         return loadingStates; // Return loadingStates after all promises are resolved
    //       });
    //     });
    // };
    // cy.waitUntil(() => checkLoadingState().then(() => true), {
    //   timeout,
    //   interval: 1000,
    //   errorMsg:
    //     "Loading state did not become false within the specified timeout.",
    // });

    // //1st method
    // cy.window().then((window) => {
    //   //this or below can be used to get the spy & validate:
    //   const result = window.cypressSpy(type);
    //   expect(result).to.eq(type);
    //   //2nd method
    //   cy.get("@reduxCypressSpy").should("have.been.calledWith", type);
    // });

    // cy.window().then((window: any) => {
    //   console.log("Window Object:", window);
    //   console.log("cypressSpy Object:", window.cypressSpy);
    //   spy = cy.spy(window, "cypressSpy");
    //   withArgs = spy.withArgs(actionType).as("reduxCypressSpy");

    //   // if (window.cypressSpy) {
    //   //   cy.spy(window, "cypressSpy").as("reduxCypressSpy");
    //   // }
    // });
    // cy.waitUntil(() => {
    //   expect(spy).to.be.called;
    //   //cy.get("@reduxCypressSpy").should("be.called");
    //   //return cy.get("@reduxCypressSpy").should("be.calledWith", actionType);
    // });
    //

    ///
    //
    //
    //
    //

    //
    //
    //

    //not able to check if cypressSpy is called with redux:actionType

    cy.window().should("have.property", "cypressSpy");
    cy.window()
      .its("cypressSpy")
      .should("be.a", "function")
      .then((cypressSpy) => {
        // // Log the cypressSpy function
        // console.log("cypressSpy:", cypressSpy);
        // const argument = actionType; // Replace with the actual argument
        // const result = cypressSpy(argument);
        // // Log the actual values
        // console.log("Argument:", argument);
        // console.log("Result:", result);
      });
    //cy.window().its("cypressSpy").should("be.calledWith", actionType);

    // Verify that cypressSpy was called with a certain Redux action
    cy.window().then((win: any) => {
      //const spy =
      cy.spy(win, "cypressSpy").as("reduxCypressSpy");
      // Wait for the spy to be called
      cy.get("@reduxCypressSpy").should("be.calledWith", actionType);
    });
    //
    //
    //
    //
    //
    //

    // //Latest try - not working
    // cy.window()
    //   .its("cypressSpy")
    //   .should("be.a", "function")
    //   .then((cypressSpy) => {
    //     // Create a Sinon spy to observe calls to cypressSpy
    //     const sinonSpy = cy.spy(cypressSpy);

    //     // // Trigger an action in your application that should be intercepted by cypressSpyMiddleware
    //     // // For example, if there's a button that triggers the action:
    //     // cy.get("button").click();

    //     // Wait for the spy call with the expected action to finish
    //     cy.waitUntil(() => {
    //       const matchingCalls = sinonSpy.getCalls().filter((call) => {
    //         return call.args[0] === actionType;
    //       });

    //       return matchingCalls.length > 0;
    //     }).then(() => {
    //       // Additional assertions or logging after the spy call with the expected action has occurred
    //       // For example, logging the arguments of the first matching call
    //       const firstMatchingCallArgs = sinonSpy.getCalls()[0].args;
    //       cy.log(
    //         "Arguments of the first matching spy call:",
    //         firstMatchingCallArgs,
    //       );
    //     });
    //   });

    //
    //

    ///
    ///
    //

    // cy.waitUntil(
    //   () => {
    //     // return cy.window().then((window) => {
    //     //   // const result = window.cypressSpy(type);
    //     //   // expect(result).to.eq(type);

    //     //   //return cy.get("@reduxCypressSpy").should("have.been.calledWith", type);
    //     //   //expect("@reduxCypressSpy").to.be.called;
    //     //   expect(window.cypressSpy).to.be.called;
    //     //   //.then(() => true) as Cypress.Chainable<boolean>;
    //     // });

    //     return cy.window().then((window) => {
    //       cy.get("@reduxCypressSpy").should("be.calledWith", actionType);
    //     });
    //   },
    //   {
    //     errorMsg: "Redux was not completed within the timeout",
    //     timeout,
    //     interval: 500, // Polling interval in milliseconds (optional, defaults to 100)
    //   },
    // );

    this.Sleep(500);
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

  public WaitForNetworkCall(aliasName: string, responseTimeout = 150000) {
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
