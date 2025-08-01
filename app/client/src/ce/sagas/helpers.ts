import omit from "lodash/omit";
import merge from "lodash/merge";
import type { CreateNewActionKeyInterface } from "ee/entities/Engine/actionHelpers";
import { CreateNewActionKey } from "ee/entities/Engine/actionHelpers";
import type { DeleteErrorLogPayload } from "actions/debuggerActions";
import type { Action } from "entities/Action";
import type { Log } from "entities/AppsmithConsole";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import type { getConfigInitialValues } from "components/formControls/utils";
import type { CreateDatasourceConfig } from "ee/api/DatasourcesApi";
import type { Datasource } from "entities/Datasource";
import { nestDSL, type FlattenedDSL } from "@shared/dsl/src/transform";

export interface ResolveParentEntityMetadataReturnType {
  parentEntityId?: string;
  parentEntityKey?: CreateNewActionKeyInterface;
}

// This function is extended in EE. Please check the EE implementation before any modification.
export interface GenerateDestinationIdInfoReturnType {
  pageId?: string;
}

// This function is extended in EE. Please check the EE implementation before any modification.
export function generateDestinationIdInfoForQueryDuplication(
  destinationEntityId: string,
  parentEntityKey: CreateNewActionKeyInterface,
): GenerateDestinationIdInfoReturnType {
  if (parentEntityKey === CreateNewActionKey.PAGE) {
    return { pageId: destinationEntityId };
  }

  return {};
}

// This function is extended in EE. Please check the EE implementation before any modification.
export const resolveParentEntityMetadata = (
  action: Partial<Action>,
): ResolveParentEntityMetadataReturnType => {
  if (action.pageId) {
    return {
      parentEntityId: action.pageId,
      parentEntityKey: CreateNewActionKey.PAGE,
    };
  }

  return { parentEntityId: undefined, parentEntityKey: undefined };
};

export function* transformAddErrorLogsSaga(logs: Log[]) {
  return logs;
}

export function* transformDeleteErrorLogsSaga(payload: DeleteErrorLogPayload) {
  return payload;
}

export function* transformTriggerEvalErrors(errors: EvaluationError[]) {
  return errors;
}

interface CreateDatasourcePayloadFromActionParams {
  currentEnvId: string;
  actionPayload: Datasource | CreateDatasourceConfig;
  initialValues: ReturnType<typeof getConfigInitialValues>;
}

export const createDatasourceAPIPayloadFromAction = (
  props: CreateDatasourcePayloadFromActionParams,
) => {
  const { actionPayload, currentEnvId, initialValues } = props;

  let datasourceStoragePayload = actionPayload.datasourceStorages[currentEnvId];

  datasourceStoragePayload = merge(initialValues, datasourceStoragePayload);

  // in the datasourcestorages, we only need one key, the currentEnvironment
  // we need to remove any other keys present
  const datasourceStorages = {
    [currentEnvId]: datasourceStoragePayload,
  };

  const payload = omit(
    {
      ...actionPayload,
      datasourceStorages,
    },
    ["id", "new", "type", "datasourceConfiguration"],
  );

  if (payload.datasourceStorages) datasourceStoragePayload.isConfigured = true;

  // remove datasourceId from payload if it is equal to TEMP_DATASOURCE_ID
  if (datasourceStoragePayload.datasourceId === TEMP_DATASOURCE_ID)
    datasourceStoragePayload.datasourceId = "";

  return payload;
};

// This function is extended in EE for UI modules
export function* getLayoutSavePayload(
  widgets: FlattenedDSL<unknown>,
  editorConfigs: Record<string, unknown>,
) {
  const nestedDSL = nestDSL(widgets, Object.keys(widgets)[0]);

  return {
    ...editorConfigs,
    dsl: nestedDSL,
  };
}

// This is a placeholder saga and is extended in EE
export function* generateUIModuleInstanceSaga() {}
