import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";
import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import { getUserApplicationsWorkspaces } from "@appsmith/selectors/applicationSelectors";
import { getWidgets } from "sagas/selectors";
import {
  getActionResponses,
  getActions,
  getCanvasWidgets,
} from "./entitiesSelector";
import { getLastSelectedWidget } from "./ui";
import { GuidedTourEntityNames } from "pages/Editor/GuidedTour/constants";

// Signposting selectors
export const getEnableFirstTimeUserOnboarding = (state: AppState) => {
  return state.ui.onBoarding.enableFirstTimeUserOnboarding;
};

export const getFirstTimeUserOnboardingApplicationId = (state: AppState) => {
  return state.ui.onBoarding.firstTimeUserOnboardingApplicationId;
};

export const getFirstTimeUserOnboardingComplete = (state: AppState) => {
  return state.ui.onBoarding.firstTimeUserOnboardingComplete;
};

export const getFirstTimeUserOnboardingModal = (state: AppState) =>
  state.ui.onBoarding.showFirstTimeUserOnboardingModal;

export const getIsFirstTimeUserOnboardingEnabled = createSelector(
  (state: AppState) => state.entities.pageList.applicationId,
  getEnableFirstTimeUserOnboarding,
  getFirstTimeUserOnboardingApplicationId,
  (currentApplicationId, enabled, applicationId) => {
    return enabled && currentApplicationId === applicationId;
  },
);

export const getInOnboardingWidgetSelection = (state: AppState) =>
  state.ui.onBoarding.inOnboardingWidgetSelection;

export const getIsOnboardingWidgetSelection = (state: AppState) =>
  state.ui.onBoarding.inOnboardingWidgetSelection;

const previewModeSelector = (state: AppState) => {
  return state.ui.editor.isPreviewMode;
};

export const getIsOnboardingTasksView = createSelector(
  getCanvasWidgets,
  getIsFirstTimeUserOnboardingEnabled,
  getIsOnboardingWidgetSelection,
  previewModeSelector,
  (
    widgets,
    enableFirstTimeUserOnboarding,
    isOnboardingWidgetSelection,
    inPreviewMode,
  ) => {
    return (
      Object.keys(widgets).length == 1 &&
      enableFirstTimeUserOnboarding &&
      !isOnboardingWidgetSelection &&
      !inPreviewMode
    );
  },
);

// Guided Tour selectors
export const isExploringSelector = (state: AppState) =>
  state.ui.guidedTour.exploring;
export const inGuidedTour = (state: AppState) => state.ui.guidedTour.guidedTour;
export const getCurrentStep = (state: AppState) =>
  state.ui.guidedTour.currentStep;
export const wasTableWidgetSelected = (state: AppState) =>
  state.ui.guidedTour.tableWidgetWasSelected;
export const showEndTourDialogSelector = (state: AppState) =>
  state.ui.guidedTour.showEndTourDialog;
export const showDeviatingDialogSelector = (state: AppState) =>
  state.ui.guidedTour.showDeviatingDialog;
export const showPostCompletionMessage = (state: AppState) =>
  state.ui.guidedTour.showPostCompletionMessage;
export const forceShowContentSelector = (state: AppState) =>
  state.ui.guidedTour.forceShowContent;

export const getTableWidget = createSelector(getWidgets, (widgets) => {
  return Object.values(widgets).find(
    (widget) => widget.widgetName === "CustomersTable",
  );
});

export const getQueryAction = createSelector(getActions, (actions) => {
  return actions.find((action) => {
    return action.config.name === "getCustomers";
  });
});

export const isQueryLimitUpdated = createSelector(getQueryAction, (query) => {
  if (query) {
    let body = query.config.actionConfiguration.body;
    if (body) {
      // eslint-disable-next-line no-console
      const regex = /SELECT \* FROM user_data ORDER BY id LIMIT 10;/gi;
      // Replacing new line characters
      body = body.replace(/(?:\r\n|\r|\n)/g, "");
      // Replace sql comments
      body = body.replace(/(\/\*[^*]*\*\/)|(\/\/[^*]*)|(--[^.].*)/gm, "");
      return regex.test(body);
    }
  }
  return false;
});

export const isQueryExecutionSuccessful = createSelector(
  getActionResponses,
  getQueryAction,
  (responses, query) => {
    if (query?.config.id && responses[query.config.id]) {
      return responses[query.config.id]?.isExecutionSuccess;
    }
  },
);

export const isTableWidgetSelected = createSelector(
  getTableWidget,
  getLastSelectedWidget,
  wasTableWidgetSelected,
  (tableWidget, selectedWidgetId, tableWidgetWasSelected) => {
    if (!tableWidgetWasSelected) {
      return tableWidget?.widgetId === selectedWidgetId;
    }

    return true;
  },
);

export const tableWidgetHasBinding = createSelector(
  getTableWidget,
  (tableWidget) => {
    if (tableWidget) {
      if (tableWidget.tableData === `{{getCustomers.data}}`) {
        return tableWidget.widgetId;
      }
    }

    return "";
  },
);

export const containerWidgetAdded = createSelector(getWidgets, (widgets) => {
  return !!Object.values(widgets).find(
    (widget) => widget.type === "CONTAINER_WIDGET",
  );
});

export const getHadReachedStep = (state: AppState) =>
  state.ui.guidedTour.hadReachedStep;

export const isNameInputBoundSelector = createSelector(
  getTableWidget,
  getWidgets,
  (tableWidget, widgets) => {
    if (tableWidget) {
      const widgetValues = Object.values(widgets);
      const countryInput = widgetValues.find((widget) => {
        if (widget.type === "INPUT_WIDGET_V2") {
          return (
            widget.defaultText ===
            `{{${tableWidget.widgetName}.selectedRow.name}}`
          );
        }
        return false;
      });

      if (countryInput) return true;
    }

    return false;
  },
);

// Get the id of NameInput
export const nameInputSelector = createSelector(getWidgets, (widgets) => {
  const widgetValues = Object.values(widgets);
  const nameInput = widgetValues.find((widget) => {
    if (widget.type === "INPUT_WIDGET_V2") {
      return widget.widgetName === "NameInput";
    }
  });

  return nameInput ? nameInput.widgetId : "";
});
// Check if CountryInput is selected
export const countryInputSelector = createSelector(
  getWidgets,
  getLastSelectedWidget,
  (widgets, selectedWidgetId) => {
    const widgetValues = Object.values(widgets);
    const countryInput = widgetValues.find((widget) => {
      if (widget.type === "INPUT_WIDGET_V2") {
        return widget.widgetName === "CountryInput";
      }
    });

    return countryInput ? countryInput.widgetId === selectedWidgetId : false;
  },
);

export const isCountryInputBound = createSelector(
  getTableWidget,
  getWidgets,
  (tableWidget, widgets) => {
    if (tableWidget) {
      const widgetValues = Object.values(widgets);
      const countryInput = widgetValues.find((widget) => {
        if (widget.widgetName === GuidedTourEntityNames.COUNTRY_INPUT) {
          return (
            widget.defaultText ===
            `{{${tableWidget.widgetName}.selectedRow.country}}`
          );
        }
        return false;
      });

      if (countryInput) return true;
    }

    return false;
  },
);

export const isEmailInputBound = createSelector(
  getTableWidget,
  getWidgets,
  (tableWidget, widgets) => {
    if (tableWidget) {
      const widgetValues = Object.values(widgets);
      const countryInput = widgetValues.find((widget) => {
        if (widget.widgetName === GuidedTourEntityNames.EMAIL_INPUT) {
          return (
            widget.defaultText ===
            `{{${tableWidget.widgetName}.selectedRow.email}}`
          );
        }

        return false;
      });

      if (countryInput) return true;
    }

    return false;
  },
);

export const isButtonWidgetPresent = createSelector(getWidgets, (widgets) => {
  const widgetValues = Object.values(widgets);
  const buttonWidget = widgetValues.find((widget) => {
    return widget.type === "BUTTON_WIDGET";
  });

  return !!buttonWidget;
});

export const buttonWidgetHasOnClickBinding = createSelector(
  getWidgets,
  (widgets) => {
    const widgetValues = Object.values(widgets);
    const buttonWidget = widgetValues.find((widget) => {
      return (
        widget.type === "BUTTON_WIDGET" &&
        widget.onClick &&
        widget.onClick.includes("{{updateCustomerInfo.run(")
      );
    });

    return !!buttonWidget;
  },
);

export const buttonWidgetHasOnSuccessBinding = createSelector(
  getWidgets,
  (widgets) => {
    const widgetValues = Object.values(widgets);
    const buttonWidget = widgetValues.find((widget) => {
      return (
        widget.type === "BUTTON_WIDGET" &&
        widget.onClick &&
        widget.onClick.includes(
          "{{updateCustomerInfo.run(() => getCustomers.run(), () => {})}}",
        )
      );
    });

    return !!buttonWidget;
  },
);

export const showSuccessMessage = (state: AppState) =>
  state.ui.guidedTour.showSuccessMessage;
export const showInfoMessageSelector = (state: AppState) =>
  state.ui.guidedTour.showInfoMessage;

export const loading = (state: AppState) => state.ui.guidedTour.loading;

// To find an workspace where the user has permission to create an
// application
export const getOnboardingWorkspaces = createSelector(
  getUserApplicationsWorkspaces,
  (userWorkspaces) => {
    return userWorkspaces.filter((userWorkspace) =>
      hasCreateNewAppPermission(userWorkspace.workspace.userPermissions ?? []),
    );
  },
);
