import type { FetchAIResponsePayload } from "ee/actions/aiAssistantActions";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";

type AIRequestContext = NonNullable<FetchAIResponsePayload["context"]> & {
  applicationId?: string;
  workflowId?: string;
};

interface EditorIdentity {
  entityId?: string;
  entityType?: string;
}

interface EditorScope {
  /** The URL is the app editor (including the custom widget builder inside it) */
  isAppEditor: boolean;
  applicationId?: string;
  workflowId?: string;
}

/**
 * Adds the ids the server authorizes an Ask AI request against.
 *
 * The server checks edit rights on the entity when there is one, then on the application, then on the workflow.
 *
 * - Its entity id is an action id, so only an action's id is sent: a widget id would be looked up as an action, miss,
 *   and refuse the request instead of falling back to the application. Any entity id the caller passed in the
 *   request context (the side panel passes the whole editor context) is dropped for the same reason.
 * - A JS object has no entity id, so in the workflow editor — which is not an application — the workflow id is what
 *   the request carries. The application and workflow ids are both sticky in Redux, so only the one for the editor
 *   the user is in is sent; otherwise a stale application id would win over the workflow.
 */
export function buildAIRequestContext(
  context: FetchAIResponsePayload["context"],
  editorContext: EditorIdentity | null,
  scope: EditorScope,
): AIRequestContext {
  const isAction =
    editorContext?.entityType === ENTITY_TYPE.ACTION &&
    Boolean(editorContext.entityId);
  const useWorkflow = !scope.isAppEditor && Boolean(scope.workflowId);
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
    ...(useWorkflow
      ? { workflowId: scope.workflowId }
      : scope.applicationId
        ? { applicationId: scope.applicationId }
        : {}),
  };
}
