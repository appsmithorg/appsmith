import { setExplorerPinnedAction } from "actions/explorerActions";
import {
  markStepComplete,
  tableWidgetWasSelected,
  enableGuidedTour,
  updateButtonWidgetText,
  forceShowContent,
  focusWidgetProperty,
  setCurrentStepInit,
} from "actions/onboardingActions";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getApplicationLastDeployedAt } from "selectors/editorSelectors";
import {
  getHadReachedStep,
  isQueryExecutionSuccessful,
  isTableWidgetSelected,
  tableWidgetHasBinding,
  containerWidgetAdded,
  nameInputSelector,
  isNameInputBoundSelector,
  isCountryInputBound,
  isEmailInputBound,
  isButtonWidgetPresent,
  buttonWidgetHasOnClickBinding,
  buttonWidgetHasOnSuccessBinding,
  countryInputSelector,
} from "selectors/onboardingSelectors";
import { getBaseWidgetClassName } from "constants/componentClassNameConstants";
import { GUIDED_TOUR_STEPS, Steps } from "./constants";
import { hideIndicator, highlightSection, showIndicator } from "./utils";

function useComputeCurrentStep(showInfoMessage: boolean) {
  let step = 1;
  const meta: {
    completedSubSteps: number[];
    hintCount: number;
  } = {
    completedSubSteps: [],
    hintCount: 0,
  };
  const dispatch = useDispatch();
  const hadReachedStep = useSelector(getHadReachedStep);
  // Step 1(Run the query) selectors
  const queryExecutedSuccessfully = useSelector(isQueryExecutionSuccessful);
  // 2 selectors
  const tableWidgetSelected = useSelector(isTableWidgetSelected);
  // 3
  const isTableWidgetBound = useSelector(tableWidgetHasBinding);
  // 4
  const isContainerWidgetPreset = useSelector(containerWidgetAdded);
  const nameInputWidgetId = useSelector(nameInputSelector);
  const isNameInputBound = useSelector(isNameInputBoundSelector);
  // 5
  const countryInputBound = useSelector(isCountryInputBound);
  const isCountryInputSelected = useSelector(countryInputSelector);
  const emailInputBound = useSelector(isEmailInputBound);
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

  // If we are on the first step
  if (step === GUIDED_TOUR_STEPS.RUN_QUERY) {
    // If the query is executed successfully and if the user had gone to further steps before
    // i.e probably the user is here after finishing step 5. This can happen if the query is updated
    // to something unexpected.
    // So we have `hadReachedStep` to keep track of the furthest the user had reached.
    // Initially we don't automatically go to the next step, instead the user clicks on a button in the guide
    // shown on top of the screen for the user clicking on which we update the current step
    if (queryExecutedSuccessfully && hadReachedStep > 1) {
      step = GUIDED_TOUR_STEPS.SELECT_TABLE_WIDGET;
    }
  }

  // On the second step
  if (step === GUIDED_TOUR_STEPS.SELECT_TABLE_WIDGET) {
    if (tableWidgetSelected) {
      step = GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING;
      // Reset back the hintcount set in previous step
      meta.hintCount = 0;
    }
  }

  if (step === GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING) {
    if (
      !!isTableWidgetBound &&
      isContainerWidgetPreset &&
      hadReachedStep > GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING
    ) {
      step = GUIDED_TOUR_STEPS.NAME_INPUT_BINDING;
    }
  }

  if (step === GUIDED_TOUR_STEPS.NAME_INPUT_BINDING) {
    if (!!isNameInputBound && hadReachedStep > 4) {
      step = GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS;
    }
  }

  if (step === GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS) {
    if (emailInputBound) {
      // We tick off widgets in the UI which are bound to the selected row.
      // This is to keep track of which ones are bound
      meta.completedSubSteps.push(0);
    }
    if (countryInputBound) {
      meta.completedSubSteps.push(1);
    }
    // Once all three widgets are bound this step is complete
    if (
      meta.completedSubSteps.length === 2 &&
      hadReachedStep > GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS
    ) {
      step = GUIDED_TOUR_STEPS.ADD_BUTTON_WIDGET;
    }
  }

  if (step === GUIDED_TOUR_STEPS.ADD_BUTTON_WIDGET) {
    if (buttonWidgetPresent && hadReachedStep > 6) {
      step = GUIDED_TOUR_STEPS.BUTTON_ONCLICK_BINDING;
    }
  }

  if (step === GUIDED_TOUR_STEPS.BUTTON_ONCLICK_BINDING) {
    if (buttonWidgetonClickBinding) {
      step = GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING;
    }
  }

  if (step === GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING) {
    if (
      buttonWidgetSuccessBinding &&
      hadReachedStep > GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING
    ) {
      step = GUIDED_TOUR_STEPS.DEPLOY;
    }
  }

  // Update the step in the store
  useEffect(() => {
    dispatch(setCurrentStepInit(step));
  }, [step]);

  // Step 1 side effects
  useEffect(() => {
    // Success messages, indicators and highlighted sections are shown initially
    // These are not shown again i.e if the user finishes step 5 and does some changes
    // which bring the step back to 1, we don't do the following changes after completing step 1
    // again.
    if (
      step === GUIDED_TOUR_STEPS.RUN_QUERY &&
      hadReachedStep <= GUIDED_TOUR_STEPS.RUN_QUERY
    ) {
      if (queryExecutedSuccessfully) {
        dispatch(forceShowContent(GUIDED_TOUR_STEPS.RUN_QUERY));
        // Hide the indicator after the user has successfully run the query
        hideIndicator();
        // This show the success message
        dispatch(markStepComplete());

        setTimeout(() => {
          if (Steps[GUIDED_TOUR_STEPS.RUN_QUERY].elementSelector) {
            // Highlight section which shows a temporary border around the target
            highlightSection(
              Steps[GUIDED_TOUR_STEPS.RUN_QUERY].elementSelector,
            );
          }
          // Adding a slight delay to wait for the table to be visible
        }, 1000);
      } else {
        showIndicator(`[data-guided-tour-iid='run-query']`, "top");
      }
    }
  }, [queryExecutedSuccessfully, step, hadReachedStep]);

  // Step 3(table widget binding) side effects
  // Focus the tableData input in the property pane
  useEffect(() => {
    if (
      tableWidgetSelected &&
      step === GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING &&
      hadReachedStep <= GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING
    ) {
      dispatch(tableWidgetWasSelected(true));
      showIndicator(`[data-guided-tour-iid='tableData']`, "top", {
        top: 20,
        left: 0,
      });
      // Focus the tableData input field
      dispatch(focusWidgetProperty("tableData"));
    }
  }, [step, tableWidgetSelected]);
  // Show success message
  useEffect(() => {
    if (
      !!isTableWidgetBound &&
      step === GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING &&
      hadReachedStep <= GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING
    ) {
      dispatch(setExplorerPinnedAction(false));
      hideIndicator();
      dispatch(markStepComplete());
    }
  }, [isTableWidgetBound, step, hadReachedStep]);

  // Step 4(Add binding to the NameInput widget) side effects
  // Highlight table widget's selected row
  useEffect(() => {
    if (
      !!isTableWidgetBound &&
      step === GUIDED_TOUR_STEPS.NAME_INPUT_BINDING &&
      hadReachedStep <= GUIDED_TOUR_STEPS.NAME_INPUT_BINDING
    ) {
      if (!!nameInputWidgetId) {
        // Minor timeout to wait for the elements to exist
        setTimeout(() => {
          // Highlight the selected row and the NameInput widget
          highlightSection(
            "selected-row",
            getBaseWidgetClassName(isTableWidgetBound),
            "class",
          );
          highlightSection(
            getBaseWidgetClassName(nameInputWidgetId),
            undefined,
            "class",
          );
        }, 500);
      }
    }
  }, [isTableWidgetBound, step, hadReachedStep, nameInputWidgetId]);
  // Show success message
  useEffect(() => {
    if (
      step === GUIDED_TOUR_STEPS.NAME_INPUT_BINDING &&
      hadReachedStep <= GUIDED_TOUR_STEPS.NAME_INPUT_BINDING
    ) {
      if (!!isNameInputBound) {
        hideIndicator();
        dispatch(markStepComplete());
      }
    }
  }, [isNameInputBound, step, hadReachedStep]);

  // Step 5
  useEffect(() => {
    if (
      step === GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS &&
      hadReachedStep <= GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS
    ) {
      if (isCountryInputSelected) {
        if (!countryInputBound) {
          showIndicator(`[data-guided-tour-iid='defaultText']`, "top", {
            top: 20,
            left: 0,
          });
        } else {
          hideIndicator();
        }
      }
    }
  }, [step, hadReachedStep, countryInputBound, isCountryInputSelected]);

  // Show success message
  useEffect(() => {
    if (
      step === GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS &&
      hadReachedStep <= GUIDED_TOUR_STEPS.BIND_OTHER_FORM_WIDGETS
    ) {
      if (meta.completedSubSteps.length === 1) {
        hideIndicator();
      }
      if (meta.completedSubSteps.length === 2) {
        dispatch(markStepComplete());
      }
    }
  }, [step, meta.completedSubSteps.length, hadReachedStep]);

  // 6
  useEffect(() => {
    if (
      step === GUIDED_TOUR_STEPS.ADD_BUTTON_WIDGET &&
      hadReachedStep <= GUIDED_TOUR_STEPS.ADD_BUTTON_WIDGET &&
      !showInfoMessage
    ) {
      if (buttonWidgetPresent) {
        dispatch(updateButtonWidgetText());
        dispatch(markStepComplete());
      }
    }
  }, [step, buttonWidgetPresent, showInfoMessage]);

  // 8
  useEffect(() => {
    if (
      step === GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING &&
      hadReachedStep <= GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING
    ) {
      if (buttonWidgetSuccessBinding) {
        dispatch(markStepComplete());
        hideIndicator();
      } else {
        showIndicator(`[data-guided-tour-iid='onSuccess']`, "top", {
          top: 20,
          left: 0,
        });
      }
    }
  }, [step, hadReachedStep, buttonWidgetSuccessBinding]);

  useEffect(() => {
    if (step === GUIDED_TOUR_STEPS.DEPLOY) {
      if (isDeployed) {
        hideIndicator();
        dispatch(enableGuidedTour(false));
      }
    }
  }, [step, isDeployed]);

  return meta;
}

export default useComputeCurrentStep;
