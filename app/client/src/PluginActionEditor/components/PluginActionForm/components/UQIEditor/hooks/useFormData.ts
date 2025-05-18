import { useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { QueryAction, SaaSAction } from "entities/Action";
import { getFormEvaluationState } from "selectors/formSelectors";
import { usePluginActionContext } from "../../../../../PluginActionContext";

export const useFormData = () => {
  const formData = useSelector(getFormValues(QUERY_EDITOR_FORM_NAME)) as
    | QueryAction
    | SaaSAction;

  const { action } = usePluginActionContext();
  const formEvaluation = useSelector(getFormEvaluationState);

  // When switching between actions, the formData is not updated immediately.
  // So we need to return null data and evaluationState in that case instead of stale data
  if (!formData || formData.id !== action.id) {
    return { data: null, evaluationState: {} };
  }

  // Fetching evaluations state only once the formData is populated
  const evaluationState = formEvaluation[formData.id];

  return { data: formData, evaluationState };
};
