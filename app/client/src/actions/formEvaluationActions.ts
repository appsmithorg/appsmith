import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { QueryActionConfig } from "entities/Action";
import type { DatasourceConfiguration } from "entities/Datasource";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";

// Called when a form is being setup, for setting up the base condition evaluations for the form
export const initFormEvaluations = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfig: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settingConfig: any,
  formId: string,
) => {
  return {
    type: ReduxActionTypes.INIT_FORM_EVALUATION,
    payload: { editorConfig, settingConfig, formId },
  };
};

// Called when there is change in the data of the form, re evaluates the whole form
export const startFormEvaluations = (
  formId: string,
  formData: QueryActionConfig,
  datasourceId: string,
  pluginId: string,
  editorContextType?: ActionParentEntityTypeInterface,
  actionDiffPath?: string,
  hasRouteChanged?: boolean,
  datasourceConfiguration?: DatasourceConfiguration,
) => {
  return {
    type: ReduxActionTypes.RUN_FORM_EVALUATION,
    payload: {
      formId,
      actionConfiguration: formData,
      datasourceId,
      pluginId,
      editorContextType,
      actionDiffPath,
      hasRouteChanged,
      datasourceConfiguration,
    },
  };
};
