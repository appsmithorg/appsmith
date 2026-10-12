import type { FetchAIResponsePayload } from "ee/actions/aiAssistantActions";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";

/** Mirrors the server's ArtifactType enum names. */
export const AI_ARTIFACT_TYPE = {
  APPLICATION: "APPLICATION",
  WORKFLOW: "WORKFLOW",
} as const;

export type AIArtifactType =
  (typeof AI_ARTIFACT_TYPE)[keyof typeof AI_ARTIFACT_TYPE];

type AIRequestContext = NonNullable<FetchAIResponsePayload["context"]> & {
  artifactId?: string;
  artifactType?: AIArtifactType;
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
 * The server checks edit rights on the entity when there is one, and otherwise on the artifact (application or
 * workflow) the editor belongs to.
 *
 * - Its entity id is an action id, so only an action's id is sent: a widget id would be looked up as an action, miss,
 *   and refuse the request instead of falling back to the artifact. Any entity id the caller passed in the request
 *   context (the side panel passes the whole editor context) is dropped for the same reason.
 * - A JS object has no entity id, so in the workflow editor the workflow is the artifact the request carries. The
 *   application and workflow ids are both sticky in Redux, so the artifact is chosen from the editor the user is in;
 *   otherwise a stale application id would win over the workflow.
 */
export function buildAIRequestContext(
  context: FetchAIResponsePayload["context"],
  editorContext: EditorIdentity | null,
  scope: EditorScope,
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
    ...getArtifact(scope),
  };
}

function getArtifact(
  scope: EditorScope,
): Pick<AIRequestContext, "artifactId" | "artifactType"> {
  if (!scope.isAppEditor && scope.workflowId) {
    return {
      artifactId: scope.workflowId,
      artifactType: AI_ARTIFACT_TYPE.WORKFLOW,
    };
  }

  if (scope.applicationId) {
    return {
      artifactId: scope.applicationId,
      artifactType: AI_ARTIFACT_TYPE.APPLICATION,
    };
  }

  return {};
}
