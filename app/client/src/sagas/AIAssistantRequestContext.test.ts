import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { buildAIRequestContext } from "./AIAssistantRequestContext";

describe("buildAIRequestContext", () => {
  const baseContext = { mode: "javascript", currentValue: "export default {}" };
  const appEditor = { isAppEditor: true, applicationId: "app-1" };

  it("sends the workflow id from the workflow editor, where a JS object has no entity id", () => {
    const result = buildAIRequestContext(
      baseContext,
      { entityType: ENTITY_TYPE.JSACTION },
      { isAppEditor: false, workflowId: "workflow-1" },
    );

    expect(result).toEqual({ ...baseContext, workflowId: "workflow-1" });
  });

  it("does not send a stale application id from the workflow editor", () => {
    const result = buildAIRequestContext(
      baseContext,
      { entityType: ENTITY_TYPE.JSACTION },
      { isAppEditor: false, applicationId: "app-1", workflowId: "workflow-1" },
    );

    expect(result).toEqual({ ...baseContext, workflowId: "workflow-1" });
  });

  it("does not send a stale workflow id from the app editor", () => {
    const result = buildAIRequestContext(
      baseContext,
      { entityType: ENTITY_TYPE.JSACTION },
      { ...appEditor, workflowId: "workflow-1" },
    );

    expect(result).toEqual({ ...baseContext, applicationId: "app-1" });
  });

  it("sends an action's id as the entity id", () => {
    const result = buildAIRequestContext(
      baseContext,
      { entityId: "action-1", entityType: ENTITY_TYPE.ACTION },
      appEditor,
    );

    expect(result).toEqual({
      ...baseContext,
      entityId: "action-1",
      applicationId: "app-1",
    });
  });

  // The side panel dispatches the whole editor context as the request context, so the widget id arrives in both.
  it("does not send a widget's id as the entity id, so the server falls back to the application", () => {
    const editorContext = {
      ...baseContext,
      entityId: "widget-1",
      entityType: ENTITY_TYPE.WIDGET,
    };

    const result = buildAIRequestContext(
      editorContext,
      editorContext,
      appEditor,
    );

    expect(result).toEqual({ ...baseContext, applicationId: "app-1" });
  });

  it("does not send an entity id when the entity type is unknown", () => {
    const result = buildAIRequestContext(
      { ...baseContext, entityId: "something-1" },
      { entityId: "something-1" },
      appEditor,
    );

    expect(result).toEqual({ ...baseContext, applicationId: "app-1" });
  });

  it("keeps the application id outside the app editor when there is no workflow", () => {
    const result = buildAIRequestContext(baseContext, null, {
      isAppEditor: false,
      applicationId: "app-1",
    });

    expect(result).toEqual({ ...baseContext, applicationId: "app-1" });
  });

  it("sends only the request context when there is no editor context or id", () => {
    expect(
      buildAIRequestContext(baseContext, null, { isAppEditor: true }),
    ).toEqual(baseContext);
    expect(
      buildAIRequestContext(undefined, null, { isAppEditor: false }),
    ).toEqual({});
  });
});
