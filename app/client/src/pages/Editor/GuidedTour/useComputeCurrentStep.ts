import { setExplorerPinnedAction } from "actions/explorerActions";
import {
  setIndicatorLocation,
  markStepComplete,
  tableWidgetWasSelected,
  enableGuidedTour,
  updateButtonWidgetText,
} from "actions/onboardingActions";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getApplicationLastDeployedAt } from "selectors/editorSelectors";
import {
  getGuidedTourDatasource,
  getQueryAction,
  getTableWidget,
  getHadReachedStep,
  isQueryLimitUpdated,
  isQueryExecutionSuccessful,
  isTableWidgetSelected,
  tableWidgetHasBinding,
  containerWidgetAdded,
  nameInputSelector,
  isNameInputBoundSelector,
  isCountryInputBound,
  isEmailInputBound,
  isImageWidgetBound,
  isButtonWidgetPresent,
  buttonWidgetHasOnClickBinding,
  buttonWidgetHasOnSuccessBinding,
} from "selectors/onboardingSelectors";
import { Steps } from "./constants";
import { GuideBody } from "./Guide";
import { highlightSection } from "./utils";

function useComputeCurrentStep(isExploring: boolean, showInfoMessage: boolean) {
  let step = 1;
  const meta: GuideBody["meta"] = {
    completedSubSteps: [],
    hintCount: 0,
  };
  const dispatch = useDispatch();
  const datasource = useSelector(getGuidedTourDatasource);
  const query = useSelector(getQueryAction);
  const tableWidget = useSelector(getTableWidget);
  const hadReachedStep = useSelector(getHadReachedStep);
  // 1
  const queryLimitUpdated = useSelector(isQueryLimitUpdated);
  const queryExecutedSuccessfully = useSelector(isQueryExecutionSuccessful);
  // 2
  const tableWidgetSelected = useSelector(isTableWidgetSelected);
  // 3
  const isTableWidgetBound = useSelector(tableWidgetHasBinding);
  // 4
  const isContainerWidgetPreset = useSelector(containerWidgetAdded);
  const nameInputWidgetId = useSelector(nameInputSelector);
  const isNameInputBound = useSelector(isNameInputBoundSelector);
  // 5
  const countryInputBound = useSelector(isCountryInputBound);
  const emailInputBound = useSelector(isEmailInputBound);
  const imageWidgetBound = useSelector(isImageWidgetBound);
  // 6
  const buttonWidgetPresent = useSelector(isButtonWidgetPresent);
  // 7
  const buttonWidgetonClickBinding = useSelector(buttonWidgetHasOnClickBinding);
  // 8
  const buttonWidgetSuccessBinding = useSelector(
    buttonWidgetHasOnSuccessBinding,
  );
  // 9
  const isDeployed = useSelector(getApplicationLastDeployedAt);

  if (step === 1) {
    if (queryLimitUpdated) {
      meta.hintCount += 1;

      if (queryExecutedSuccessfully && hadReachedStep > 1) {
        step = 2;
      }
    }
  }

  if (step === 2) {
    if (tableWidgetSelected) {
      step = 3;
      // Reset back the hintcount set in previous step
      meta.hintCount = 0;
    }
  }

  if (step === 3) {
    if (!!isTableWidgetBound && isContainerWidgetPreset && hadReachedStep > 3) {
      step = 4;
    }
  }

  if (step === 4) {
    if (!!isNameInputBound && hadReachedStep > 4) {
      step = 5;
    }
  }

  if (step === 5) {
    if (emailInputBound) {
      meta.completedSubSteps.push(0);
    }
    if (countryInputBound) {
      meta.completedSubSteps.push(1);
    }
    if (imageWidgetBound) {
      meta.completedSubSteps.push(2);
    }

    if (meta.completedSubSteps.length === 3 && hadReachedStep > 5) {
      step = 6;
    }
  }

  if (step === 6) {
    if (buttonWidgetPresent && hadReachedStep > 6) {
      step = 7;
    }
  }

  if (step === 7) {
    if (buttonWidgetonClickBinding) {
      step = 8;
    }
  }

  if (step === 8) {
    if (buttonWidgetSuccessBinding && hadReachedStep > 8) {
      step = 9;
    }
  }

  useEffect(() => {
    if (datasource?.id) {
      dispatch({
        type: "SET_DATASOURCE_ID",
        payload: datasource.id,
      });
    }
  }, [datasource]);

  useEffect(() => {
    if (query) {
      dispatch({
        type: "SET_QUERY_ID",
        payload: query.config.id,
      });
    }
  }, [query]);

  useEffect(() => {
    if (tableWidget) {
      dispatch({
        type: "SET_TABLE_WIDGET_ID",
        payload: tableWidget?.widgetId,
      });
    }
  }, [tableWidget]);

  useEffect(() => {
    if (!isExploring) {
      dispatch({
        type: "SET_CURRENT_STEP",
        payload: step,
      });
    }
  }, [isExploring, step]);

  // Step 1 effects
  useEffect(() => {
    if (step === 1 && hadReachedStep <= 1) {
      if (!queryLimitUpdated) {
        dispatch(setIndicatorLocation("QUERY_EDITOR"));
      } else if (queryExecutedSuccessfully) {
        dispatch(setIndicatorLocation("NONE"));
        dispatch(markStepComplete());
        if (Steps[1].elementSelector) {
          highlightSection(Steps[1].elementSelector);
        }
      } else {
        dispatch(setIndicatorLocation("RUN_QUERY"));
      }
    }
  }, [queryExecutedSuccessfully, queryLimitUpdated, step, hadReachedStep]);

  useEffect(() => {
    if (tableWidgetSelected && step === 3 && hadReachedStep <= 3) {
      dispatch(tableWidgetWasSelected(true));
      dispatch(setIndicatorLocation("PROPERTY_CONTROL"));
    }
  }, [step, tableWidgetSelected]);

  useEffect(() => {
    if (!!isTableWidgetBound && step === 3 && hadReachedStep <= 3) {
      dispatch(setExplorerPinnedAction(false));
      dispatch(setIndicatorLocation("NONE"));
      dispatch(markStepComplete());
    }
  }, [isTableWidgetBound, step, hadReachedStep]);

  useEffect(() => {
    if (!!isTableWidgetBound && step === 4 && hadReachedStep <= 4) {
      if (!!nameInputWidgetId) {
        setTimeout(() => {
          highlightSection(
            "selected-row",
            `appsmith_widget_${isTableWidgetBound}`,
            "class",
          );
          highlightSection(
            `appsmith_widget_${nameInputWidgetId}`,
            undefined,
            "class",
          );
        }, 1000);
      }
    }
  }, [isTableWidgetBound, step, hadReachedStep, nameInputWidgetId]);

  // 4
  useEffect(() => {
    if (step === 4 && hadReachedStep <= 4) {
      if (!!isNameInputBound) {
        dispatch(markStepComplete());
      }
    }
  }, [isNameInputBound, step, hadReachedStep]);

  // 5
  useEffect(() => {
    if (
      step === 5 &&
      meta.completedSubSteps.length === 3 &&
      hadReachedStep <= 5
    ) {
      dispatch(markStepComplete());
    }
  }, [step, meta.completedSubSteps.length, hadReachedStep]);

  // 6
  useEffect(() => {
    if (step === 6 && hadReachedStep <= 6 && !showInfoMessage) {
      if (buttonWidgetPresent) {
        dispatch(setIndicatorLocation("NONE"));
        dispatch(updateButtonWidgetText());
        dispatch(markStepComplete());
      }
    }
  }, [step, buttonWidgetPresent, showInfoMessage]);

  useEffect(() => {
    if (step === 7 && hadReachedStep <= 7) {
      if (buttonWidgetonClickBinding) {
        dispatch(setIndicatorLocation("ACTION_CREATOR"));
      }
    }
  }, [step, buttonWidgetonClickBinding, hadReachedStep]);

  useEffect(() => {
    if (step === 8) {
      if (buttonWidgetSuccessBinding) {
        dispatch(markStepComplete());
        dispatch(setIndicatorLocation("NONE"));
      }
    }
  }, [step, buttonWidgetSuccessBinding]);

  useEffect(() => {
    if (step === 9) {
      if (isDeployed) {
        dispatch(enableGuidedTour(false));
      }
    }
  }, [step, isDeployed]);

  return meta;
}

export default useComputeCurrentStep;
