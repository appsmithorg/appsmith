import type { FetchAIResponsePayload } from "ee/actions/aiAssistantActions";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { AIArtifact } from "ee/selectors/aiAssistantSelectors";

type AIRequestContext = NonNullable<FetchAIResponsePayload["context"]> &
  AIArtifact;

interface EditorIdentity {
  entityId?: string;
  entityType?: string;
}

/**
 * Adds the ids the server authorizes an Ask AI request against.
 *
 * The server checks edit rights on the entity when there is one. Otherwise it checks the artifact whose editor the
 * user is in.
 *
 * - The server looks up the entity id as an action, so only an action's id is sent. A widget id would miss that
 *   lookup, and the server would refuse the request instead of falling back to the artifact.
 * - The side panel passes the whole editor context as the request context. Any entity id in it is dropped for the same
 *   reason.
 */
export function buildAIRequestContext(
  context: FetchAIResponsePayload["context"],
  editorContext: EditorIdentity | null,
  artifact: AIArtifact,
): AIRequestContext {
  const isAction =
    editorContext?.entityType === ENTITY_TYPE.ACTION &&
    Boolean(editorContext.entityId);
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entityId: _callerEntityId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entityType: _callerEntityType,
    ...rest
  } = (context || {}) as AIRequestContext & { entityType?: string };

  return {
    ...rest,
    ...(isAction ? { entityId: editorContext?.entityId } : {}),
    ...(artifact.artifactId ? artifact : {}),
  };
}
