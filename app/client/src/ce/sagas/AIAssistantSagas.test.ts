import { expectSaga } from "redux-saga-test-plan";

import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import UserApi from "ee/api/UserApi";
import {
  getAIAssistantState,
  getAIEditorContext,
} from "ee/selectors/aiAssistantSelectors";
import { getCurrentWorkflowId } from "ee/selectors/workflowSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import aiAssistantSagasListener from "./AIAssistantSagas";

jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  toast: { show: jest.fn() },
}));

const APP_EDITOR_URL = "/app/my-app/page1-6123456789abcdef01234567/edit";
const WORKFLOW_EDITOR_URL = "/workflow/6123456789abcdef01234568/edit";

const aiState = {
  isEnabled: true,
  provider: "CLAUDE",
  messages: [],
};

const okResponse = {
  responseMeta: { success: true },
  data: { response: "done" },
};

/**
 * Drives the real FETCH_AI_RESPONSE path the way the side panel does — the whole editor context is the request
 * context — and returns the context the saga sends to the server. This is the wiring the server authorizes against:
 * if it stops sending the workflow id from the workflow editor, Ask AI there fails with "Editor context must identify
 * an entity or an application" again.
 */
async function requestContextFor(
  url: string,
  editorContext: Record<string, unknown>,
  ids: { applicationId?: string; workflowId?: string },
) {
  window.history.pushState({}, "", url);

  const requestAIResponse = jest.fn().mockResolvedValue(okResponse);

  const selected = new Map<unknown, unknown>([
    [getAIAssistantState, aiState],
    [getAIEditorContext, editorContext],
    [getCurrentApplicationId, ids.applicationId],
    [getCurrentWorkflowId, ids.workflowId],
  ]);

  await expectSaga(aiAssistantSagasListener)
    .provide({
      // Dynamic providers so an id that is absent is returned as undefined rather than falling through to the real
      // selector, which has no store to read here.
      select({ selector }, next) {
        return selected.has(selector) ? selected.get(selector) : next();
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

  return requestAIResponse.mock.calls[0][2];
}

describe("fetchAIResponseSaga request context", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("sends the workflow as the artifact, not a stale application, from the workflow editor", async () => {
    const context = await requestContextFor(
      WORKFLOW_EDITOR_URL,
      {
        mode: "javascript",
        entityName: "Main",
        entityType: ENTITY_TYPE.JSACTION,
      },
      { applicationId: "stale-app", workflowId: "workflow-1" },
    );

    expect(context).toMatchObject({
      artifactId: "workflow-1",
      artifactType: "WORKFLOW",
    });
    expect(context).not.toHaveProperty("entityId");
  });

  it("sends the application as the artifact, not a stale workflow, from the app editor", async () => {
    const context = await requestContextFor(
      APP_EDITOR_URL,
      {
        mode: "javascript",
        entityName: "JSObject1",
        entityType: ENTITY_TYPE.JSACTION,
      },
      { applicationId: "app-1", workflowId: "stale-workflow" },
    );

    expect(context).toMatchObject({
      artifactId: "app-1",
      artifactType: "APPLICATION",
    });
  });

  it("does not send a widget's id as the entity id from a widget property binding", async () => {
    const context = await requestContextFor(
      APP_EDITOR_URL,
      {
        mode: "javascript",
        entityName: "Table1",
        entityId: "widget-1",
        entityType: ENTITY_TYPE.WIDGET,
      },
      { applicationId: "app-1" },
    );

    expect(context).toMatchObject({
      artifactId: "app-1",
      artifactType: "APPLICATION",
    });
    expect(context).not.toHaveProperty("entityId");
  });

  it("sends a query's action id as the entity id", async () => {
    const context = await requestContextFor(
      APP_EDITOR_URL,
      {
        mode: "sql",
        entityName: "Query1",
        entityId: "action-1",
        entityType: ENTITY_TYPE.ACTION,
      },
      { applicationId: "app-1" },
    );

    expect(context).toMatchObject({
      entityId: "action-1",
      artifactId: "app-1",
      artifactType: "APPLICATION",
    });
  });
});
