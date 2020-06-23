import React, { useState, useEffect } from "react";
import CreatableDropdown from "components/designSystems/appsmith/CreatableDropdown";
import { connect } from "react-redux";
import { Field, formValueSelector, change } from "redux-form";
import { AppState } from "reducers";
import { ReactComponent as StorageIcon } from "assets/icons/menu/storage.svg";
import { DatasourceDataState } from "reducers/entityReducers/datasourceReducer";
import { Plugin } from "api/PluginApi";
import { getDatasourcePlugins } from "selectors/entitiesSelector";
import _ from "lodash";
import { createDatasource, storeAsDatasource } from "actions/datasourceActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Datasource, CreateDatasourceConfig } from "api/DatasourcesApi";
import styled, { createGlobalStyle } from "styled-components";
import { MenuItem, Menu, Popover, Position } from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { theme } from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { InputActionMeta } from "react-select";
import { setDatasourceFieldText } from "actions/apiPaneActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";

interface ReduxStateProps {
  datasources: DatasourceDataState;
  validDatasourcePlugins: Plugin[];
  apiId: string;
  value: Datasource;
  organizationId: string;
}
interface ReduxActionProps {
  createDatasource: (value: string) => void;
  storeAsDatasource: () => void;
  changeDatasource: (value: Datasource | CreateDatasourceConfig) => void;
  changePath: (value: string) => void;
  setDatasourceFieldText: (apiId: string, value: string) => void;
}

interface ComponentProps {
  name: string;
  pluginId: string;
  appName: string;
  datasourceFieldText: string;
}

const DatasourcesField = (
  props: ReduxActionProps & ReduxStateProps & ComponentProps,
) => {
  const [inputValue, setValue] = useState(props.datasourceFieldText);

  useEffect(() => {
    setValue(props.datasourceFieldText);
  }, [props.datasourceFieldText]);

  const options = React.useMemo(() => {
    return props.datasources.list
      .filter(r => r.pluginId === props.pluginId)
      .filter(r => {
        return props.validDatasourcePlugins.some(
          plugin => plugin.id === r.pluginId,
        );
      })
      .filter(r => r.datasourceConfiguration)
      .filter(r => r.datasourceConfiguration.url)
      .map(r => ({
        label: r.datasourceConfiguration?.url,
        value: r.id,
      }));
  }, [props.datasources.list, props.validDatasourcePlugins, props.pluginId]);

  const { storeAsDatasource } = props;
  let isEmbeddedDatasource = true;

  if (props.value && props.value.id) {
    isEmbeddedDatasource = false;
  } else if (props.value && props.value.datasourceConfiguration) {
    isEmbeddedDatasource = true;
  }

  return (
    <Field
      name={props.name}
      component={CreatableDropdown}
      isLoading={props.datasources.loading}
      options={options}
      components={{
        ClearIndicator: () => null,
        IndicatorSeparator: () => null,
      }}
      placeholder="https://<base-url>.com"
      onInputChange={(value: string, actionMeta: InputActionMeta) => {
        const { action } = actionMeta;
        if (action === "input-blur") {
          props.setDatasourceFieldText(props.apiId, inputValue);

          return value;
        } else if (action === "set-value") {
          setValue("");

          return "";
        } else if (action === "menu-close") {
          return value;
        }
        setValue(value);
        if (isEmbeddedDatasource) {
          let datasourcePayload: {
            name: string;
            datasourceConfiguration: { url: string };
          };
          let pathPayload: string;
          const defaultDatasourcePayload = {
            pluginId: props.pluginId,
            appName: props.appName,
            organizationId: props.organizationId,
          };

          try {
            const url = new URL(value);
            const path = url.pathname === "/" ? "" : url.pathname;
            const params = url.search;
            const baseUrl = url.origin;

            datasourcePayload = {
              name: baseUrl || "DEFAULT_REST_DATASOURCE",
              datasourceConfiguration: {
                url: baseUrl,
              },
            };
            pathPayload = path + params;
          } catch (e) {
            datasourcePayload = {
              name: value || "DEFAULT_REST_DATASOURCE",
              datasourceConfiguration: {
                url: value,
              },
            };
            pathPayload = "";
          }

          const updateValues = _.debounce(() => {
            props.changeDatasource({
              ...defaultDatasourcePayload,
              ...datasourcePayload,
            });
            props.changePath(pathPayload);
          }, 50);

          updateValues();
        } else {
          const updatePath = _.debounce(() => {
            props.changePath(value);
          }, 50);

          updatePath();
        }
      }}
      format={(value: Datasource) => {
        if (!value || !value.datasourceConfiguration) return "";

        if (!value.id) {
          return "";
        }

        const option = _.find(options, { value: value.id });

        return option ? [option] : "";
      }}
      parse={(option: { value: string }[]) => {
        if (!option) return null;

        if (option.length) {
          const datasources = props.datasources.list;

          return datasources.find(
            datasource => datasource.id === option[0].value,
          );
        }
      }}
      inputValue={inputValue}
      noOptionsMessage={() => null}
    />
  );
};

const mapStateToProps = (state: AppState): ReduxStateProps => {
  const selector = formValueSelector(API_EDITOR_FORM_NAME);
  const apiId = selector(state, "id");
  const datasource = selector(state, "datasource");
  const organizationId = getCurrentOrgId(state);
  return {
    datasources: state.entities.datasources,
    validDatasourcePlugins: getDatasourcePlugins(state),
    apiId,
    value: datasource,
    organizationId,
  };
};

const mapDispatchToProps = (
  dispatch: any,
  ownProps: ComponentProps,
): ReduxActionProps => ({
  createDatasource: (value: string) => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      appName: ownProps.appName,
      dataSource: value,
    });
    // "https://example.com/ "
    // "https://example.com "
    const trimmedValue = value.trim();
    dispatch(
      createDatasource({
        // Datasource name should not end with /
        name: trimmedValue.endsWith("/")
          ? trimmedValue.slice(0, -1)
          : trimmedValue,
        datasourceConfiguration: {
          // Datasource url should end with /
          url: trimmedValue.endsWith("/") ? trimmedValue : `${trimmedValue}/`,
        },
        pluginId: ownProps.pluginId,
        appName: ownProps.appName,
      }),
    );
  },
  storeAsDatasource: () => dispatch(storeAsDatasource()),
  changeDatasource: value => {
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", value));
  },
  changePath: (value: string) => {
    dispatch(change(API_EDITOR_FORM_NAME, "actionConfiguration.path", value));
  },
  setDatasourceFieldText: (apiId, value) => {
    dispatch(setDatasourceFieldText(apiId, value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasourcesField);
