import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getUserApplicationsOrgs } from "./applicationSelectors";
import { isEqual } from "lodash";
import { getWidgets } from "sagas/selectors";
import { getActionResponses, getActions } from "./entitiesSelector";
import { getSelectedWidget } from "./ui";

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

// Guided Tour selectors
export const isExploringSelector = (state: AppState) =>
  state.ui.onBoarding.exploring;
export const inGuidedTour = (state: AppState) => state.ui.onBoarding.guidedTour;
export const getCurrentStep = (state: AppState) =>
  state.ui.onBoarding.currentStep;
export const getGuidedTourTableWidget = (state: AppState) =>
  state.ui.onBoarding.tableWidgetId;
export const getGuidedTourQuery = (state: AppState) =>
  state.ui.onBoarding.queryId;
export const wasTableWidgetSelected = (state: AppState) =>
  state.ui.onBoarding.tableWidgetWasSelected;
export const showEndTourDialogSelector = (state: AppState) =>
  state.ui.onBoarding.showEndTourDialog;
export const showDeviatingDialogSelector = (state: AppState) =>
  state.ui.onBoarding.showDeviatingDialog;
export const showPostCompletionMessage = (state: AppState) =>
  state.ui.onBoarding.showPostCompletionMessage;
export const forceShowContentSelector = (state: AppState) =>
  state.ui.onBoarding.forceShowContent;

export const getQueryName = (state: AppState) => {
  const queryId = getGuidedTourQuery(state);
  const actions = getActions(state);
  const query = actions.find((action) => action.config.id === queryId);

  if (query?.config.name) return query?.config.name;
  return "getCustomers";
};
export const getTableName = createSelector(
  getGuidedTourTableWidget,
  getWidgets,
  (tableWidgetId, widgets) => {
    const tableWidget = widgets[tableWidgetId];

    if (tableWidget) {
      return tableWidget.widgetName;
    } else {
      return "CustomersTable";
    }
  },
);

export const getTableWidget = createSelector(
  getWidgets,
  getGuidedTourTableWidget,
  (widgets, guidedTourTableWidgetId) => {
    const tableWidget = widgets[guidedTourTableWidgetId];

    if (!tableWidget) {
      return Object.values(widgets).find(
        (widget) => widget.type === "TABLE_WIDGET",
      );
    } else {
      return tableWidget;
    }
  },
);

export const getGuidedTourDatasource = (state: AppState) => {
  const datasources = state.entities.datasources;
  const dbConfig = {
    connection: {
      mode: "READ_WRITE",
      ssl: {
        authType: "DEFAULT",
      },
    },
    endpoints: [
      {
        host: "fake-api.cvuydmurdlas.us-east-1.rds.amazonaws.com",
      },
    ],
    authentication: {
      authenticationType: "dbAuth",
      username: "users",
      databaseName: "users",
    },
  };
  const datasource = datasources.list.find((datasource) =>
    isEqual(datasource.datasourceConfiguration, dbConfig),
  );

  return datasource;
};

export const getQueryAction = createSelector(
  getActions,
  getGuidedTourQuery,
  (actions, guidedTourQueryId) => {
    const query = actions.find(
      (action) => action.config.id === guidedTourQueryId,
    );

    if (!query) {
      return actions.find((action) => {
        return action.config.name === "getCustomers";
      });
    } else {
      return query;
    }
  },
);

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
  getGuidedTourQuery,
  (responses, queryId) => {
    if (queryId && responses[queryId]) {
      return responses[queryId]?.isExecutionSuccess;
    }
  },
);

export const isTableWidgetSelected = createSelector(
  getGuidedTourTableWidget,
  getSelectedWidget,
  wasTableWidgetSelected,
  (tableWidgetId, selectedWidgetId, tableWidgetWasSelected) => {
    if (!tableWidgetWasSelected) {
      return tableWidgetId === selectedWidgetId;
    }

    return true;
  },
);

export const tableWidgetHasBinding = createSelector(
  getTableWidget,
  getQueryName,
  (tableWidget, queryName) => {
    if (tableWidget && queryName) {
      if (tableWidget.tableData === `{{${queryName}.data}}`) {
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
  state.ui.onBoarding.hadReachedStep;

export const isNameInputBoundSelector = createSelector(
  getTableWidget,
  getWidgets,
  (tableWidget, widgets) => {
    if (tableWidget) {
      const widgetValues = Object.values(widgets);
      const countryInput = widgetValues.find((widget) => {
        if (widget.type === "INPUT_WIDGET") {
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

export const nameInputSelector = createSelector(getWidgets, (widgets) => {
  const widgetValues = Object.values(widgets);
  const nameInput = widgetValues.find((widget) => {
    if (widget.type === "INPUT_WIDGET") {
      return widget.widgetName === "NameInput";
    }
  });

  return nameInput ? nameInput.widgetId : "";
});

export const isCountryInputBound = createSelector(
  getTableWidget,
  getWidgets,
  (tableWidget, widgets) => {
    if (tableWidget) {
      const widgetValues = Object.values(widgets);
      const countryInput = widgetValues.find((widget) => {
        if (widget.type === "INPUT_WIDGET") {
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
        if (widget.type === "INPUT_WIDGET") {
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

export const isImageWidgetBound = createSelector(
  getTableWidget,
  getWidgets,
  (tableWidget, widgets) => {
    if (tableWidget) {
      const widgetValues = Object.values(widgets);
      const countryInput = widgetValues.find((widget) => {
        if (widget.type === "IMAGE_WIDGET") {
          return (
            widget.image === `{{${tableWidget.widgetName}.selectedRow.image}}`
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
  state.ui.onBoarding.showSuccessMessage;
export const showInfoMessageSelector = (state: AppState) =>
  state.ui.onBoarding.showInfoMessage;

export const loading = (state: AppState) => state.ui.onBoarding.loading;

// To find an organisation where the user has permission to create an
// application
export const getOnboardingOrganisations = createSelector(
  getUserApplicationsOrgs,
  (userOrgs) => {
    return userOrgs.filter((userOrg) =>
      isPermitted(
        userOrg.organization.userPermissions || [],
        PERMISSION_TYPE.CREATE_APPLICATION,
      ),
    );
  },
);
