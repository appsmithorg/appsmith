import { expectSaga } from "redux-saga-test-plan";

import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { IDE_TYPE } from "ee/IDE/Interfaces/IDETypes";
import UserApi from "ee/api/UserApi";
import {
  getAIArtifact,
  getAIAssistantState,
  getAIEditorContext,
} from "ee/selectors/aiAssistantSelectors";
import aiAssistantSagasListener from "./AIAssistantSagas";

jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  toast: { show: jest.fn() },
}));

const APP_EDITOR_URL = "/app/my-app/page1-6123456789abcdef01234567/edit";

const aiState = {
  isEnabled: true,
  provider: "CLAUDE",
  messages: [],
};

const okResponse = {
  responseMeta: { success: true },
  data: { response: "done" },
};

const application = { artifactId: "app-1", artifactType: "APPLICATION" };

/**
 * Drives the real FETCH_AI_RESPONSE path the way the side panel does: the whole editor context is the request
 * context. Returns the context the saga sends to the server and the IDE type it passed to getAIArtifact.
 */
async function requestFor(url: string, editorContext: Record<string, unknown>) {
  window.history.pushState({}, "", url);

  const requestAIResponse = jest.fn().mockResolvedValue(okResponse);
  const artifactArgs: unknown[][] = [];

  await expectSaga(aiAssistantSagasListener)
    .provide({
      select({ args, selector }, next) {
        if (selector === getAIAssistantState) return aiState;

        if (selector === getAIEditorContext) return editorContext;

        if (selector === getAIArtifact) {
          artifactArgs.push(args);

          return application;
        }

        return next();
      },
      call(effect, next) {
        return effect.fn === UserApi.requestAIResponse
          ? requestAIResponse(...effect.args)
          : next();
      },
    })
    .dispatch({
      type: ReduxActionTypes.FETCH_AI_RESPONSE,
      payload: { prompt: "Find and fix any bugs", context: editorContext },
    })
    .silentRun(1000);

  expect(requestAIResponse).toHaveBeenCalledTimes(1);

  return { context: requestAIResponse.mock.calls[0][2], artifactArgs };
}

describe("fetchAIResponseSaga request context", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  // EE overrides getAIArtifact per editor. The IDE type comes from the URL, because the ids of earlier editors stay
  // in Redux after the user leaves them.
  it("asks getAIArtifact for the artifact of the editor in the URL", async () => {
    const { artifactArgs } = await requestFor(APP_EDITOR_URL, {
      mode: "javascript",
      entityName: "JSObject1",
      entityType: ENTITY_TYPE.JSACTION,
    });

    expect(artifactArgs).toEqual([[IDE_TYPE.App]]);
  });

  // CE has no workflow editor, so its URL resolves to IDE_TYPE.None. EE resolves it to IDE_TYPE.Workflow.
  it("passes the IDE type of a non-app URL, not the app editor's", async () => {
    const { artifactArgs } = await requestFor(
      "/workflow/6123456789abcdef01234568/edit",
      {
        mode: "javascript",
        entityName: "Main",
        entityType: ENTITY_TYPE.JSACTION,
      },
    );

    expect(artifactArgs).toEqual([[IDE_TYPE.None]]);
  });

  it("sends the artifact from a JS object, which has no entity id", async () => {
    const { context } = await requestFor(APP_EDITOR_URL, {
      mode: "javascript",
      entityName: "JSObject1",
      entityType: ENTITY_TYPE.JSACTION,
    });

    expect(context).toMatchObject(application);
    expect(context).not.toHaveProperty("entityId");
  });

  it("does not send a widget's id as the entity id from a widget property binding", async () => {
    const { context } = await requestFor(APP_EDITOR_URL, {
      mode: "javascript",
      entityName: "Table1",
      entityId: "widget-1",
      entityType: ENTITY_TYPE.WIDGET,
    });

    expect(context).toMatchObject(application);
    expect(context).not.toHaveProperty("entityId");
  });

  it("sends a query's action id as the entity id", async () => {
    const { context } = await requestFor(APP_EDITOR_URL, {
      mode: "sql",
      entityName: "Query1",
      entityId: "action-1",
      entityType: ENTITY_TYPE.ACTION,
    });

    expect(context).toMatchObject({ entityId: "action-1", ...application });
  });
});
