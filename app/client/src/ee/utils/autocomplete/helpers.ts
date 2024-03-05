import type { Def } from "tern";

export const eeAppsmithAutocompleteDefs = (generatedTypeDef: Def) => {
  const currentPath = window.location.pathname;
  const isWorkflowEditor = currentPath.includes("/workflow/");
  if (!isWorkflowEditor) {
    return {
      workflows: {},
    };
  }

  return {
    workflows: {
      ...(generatedTypeDef.workflows as Def),
      "!doc":
        "Object containing functions that allow you to assign a response to a request made by the application.",
      "!url":
        "https://docs.appsmith.com/reference/appsmith-framework/context-object#workflows-object",
      assignRequest: {
        "!type":
          "fn(payload: {requestName: string, resolutions: [string], requestToUsers?: [string], requestToGroups?: [string], message?: string, metadata?: {}}) -> +Promise",
        "!doc":
          "Assigns a response to a request made by the application. This is useful when you want to mock a response for a request made by the application.",
        "!url":
          "https://docs.appsmith.com/reference/appsmith-framework/context-object#workflowsassignrequest",
      },
    },
  };
};
