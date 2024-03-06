import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import * as _objects from "../../../../support/Objects/ObjectsCore";

describe("Window message listener", { tags: ["@tag.JS"] }, () => {
  // window.cloudHosting = false
  it("Exist in self-hosted instance", () => {
    _objects.jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
            windowMessageListener("https://domain.com", () => {});
            unlistenWindowMessage("https://domain.com");
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        completeReplace: true,
        paste: true,
        shouldCreateNewJSObj: true,
        toRun: true,
        prettify: true,
      },
    );
    featureFlagIntercept({ license_message_listener_enabled: true });
    _objects.debuggerHelper.AssertErrorCount(0);
  });

  it("Exist in self-hosted instance", () => {
    _objects.jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
            windowMessageListener("https://domain.com", () => {});
            unlistenWindowMessage("https://domain.com");
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        completeReplace: true,
        paste: true,
        shouldCreateNewJSObj: true,
        toRun: true,
        prettify: true,
      },
    );
    featureFlagIntercept({ license_message_listener_enabled: false });
    cy.wait(2000);
    //since we have an extra reload in the test, we need to assert the error count twice
    _objects.debuggerHelper.AssertErrorCount(4);
  });

  // window.cloudHosting = true
  // need to see where this can be executed for window.cloudHosting to be true
  // for now adding a unit test
  /*it("Doesn't exist in cloud instance", () => {
    _objects.jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
            windowMessageListener("https://domain.com", () => {});
            unlistenWindowMessage("https://domain.com");
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        completeReplace: true,
        paste: true,
        shouldCreateNewJSObj: true,
        toRun: true,
        prettify: true,
      },
    );
    _objects.debuggerHelper.AssertErrorCount(2);
  }); */
});
