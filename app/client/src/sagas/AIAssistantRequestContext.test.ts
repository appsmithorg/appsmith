import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { buildAIRequestContext } from "./AIAssistantRequestContext";

describe("buildAIRequestContext", () => {
  const baseContext = { mode: "javascript", currentValue: "export default {}" };
  const application = { artifactId: "app-1", artifactType: "APPLICATION" };

  it("sends the artifact when there is no action, such as for a JS object", () => {
    const result = buildAIRequestContext(
      baseContext,
      { entityType: ENTITY_TYPE.JSACTION },
      application,
    );

    expect(result).toEqual({ ...baseContext, ...application });
  });

  it("sends an action's id as the entity id", () => {
    const result = buildAIRequestContext(
      baseContext,
      { entityId: "action-1", entityType: ENTITY_TYPE.ACTION },
      application,
    );

    expect(result).toEqual({
      ...baseContext,
      entityId: "action-1",
      ...application,
    });
  });

  // The side panel dispatches the whole editor context as the request context, so the widget id arrives in both.
  it("does not send a widget's id as the entity id, so the server falls back to the artifact", () => {
    const editorContext = {
      ...baseContext,
      entityId: "widget-1",
      entityType: ENTITY_TYPE.WIDGET,
    };

    const result = buildAIRequestContext(
      editorContext,
      editorContext,
      application,
    );

    expect(result).toEqual({ ...baseContext, ...application });
  });

  it("does not send an entity id when the entity type is unknown", () => {
    const result = buildAIRequestContext(
      { ...baseContext, entityId: "something-1" },
      { entityId: "something-1" },
      application,
    );

    expect(result).toEqual({ ...baseContext, ...application });
  });

  it("sends only the request context when there is no editor context or artifact", () => {
    expect(buildAIRequestContext(baseContext, null, {})).toEqual(baseContext);
    expect(buildAIRequestContext(undefined, null, {})).toEqual({});
  });
});
