import { useEffect } from "react";
import { initFormEvaluations } from "actions/evaluationActions";
import { useDispatch } from "react-redux";
import { usePluginActionContext } from "../../../../../PluginActionContext";

export const useInitFormEvaluation = () => {
  const dispatch = useDispatch();

  const {
    action: { baseId },
    editorConfig,
    settingsConfig,
  } = usePluginActionContext();

  useEffect(
    function formEvaluationInit() {
      dispatch(initFormEvaluations(editorConfig, settingsConfig, baseId));
    },
    [baseId, dispatch, editorConfig, settingsConfig],
  );
};
