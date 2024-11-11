import { useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { QueryAction, SaaSAction } from "entities/Action";
import { getFormEvaluationState } from "selectors/formSelectors";

export const useFormData = () => {
  const data = useSelector(getFormValues(QUERY_EDITOR_FORM_NAME)) as
    | QueryAction
    | SaaSAction;

  const formEvaluation = useSelector(getFormEvaluationState);

  let evaluationState = {};

  // Fetching evaluations state only once the formData is populated
  if (!!data) {
    evaluationState = formEvaluation[data.id];
  }

  return { data, evaluationState };
};
