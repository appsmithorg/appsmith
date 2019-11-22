import React from "react";
import CreatableDropdown from "../../designSystems/appsmith/CreatableDropdown";
import { connect } from "react-redux";
import { Field } from "redux-form";
import { AppState } from "../../../reducers";
import { DatasourceDataState } from "../../../reducers/entityReducers/datasourceReducer";
import _ from "lodash";
import { createDatasource } from "../../../actions/datasourcesActions";
import { REST_PLUGIN_ID } from "../../../constants/ApiEditorConstants";

interface ReduxStateProps {
  datasources: DatasourceDataState;
}
interface ReduxActionProps {
  createDatasource: (value: string) => void;
}

interface ComponentProps {
  name: string;
}

const DatasourcesField = (
  props: ReduxActionProps & ReduxStateProps & ComponentProps,
) => {
  const options = props.datasources.list
    .filter(r => r.datasourceConfiguration !== null)
    .map(r => ({
      label: r.datasourceConfiguration.url.endsWith("/")
        ? r.datasourceConfiguration.url.slice(0, -1)
        : r.datasourceConfiguration.url,
      value: r.id,
    }));
  return (
    <Field
      name={props.name}
      component={CreatableDropdown}
      isLoading={props.datasources.loading}
      options={options}
      placeholder="Data Source"
      onCreateOption={props.createDatasource}
      format={(value: string) => _.find(options, { value })}
      parse={(option: { value: string }) => (option ? option.value : null)}
      formatCreateLabel={(value: string) => `Create data source "${value}"`}
    />
  );
};

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  datasources: state.entities.datasources,
});

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  createDatasource: (value: string) =>
    dispatch(
      createDatasource({
        // Datasource name should not end with /
        name: value.endsWith("/") ? value.slice(0, -1) : value,
        datasourceConfiguration: {
          // Datasource url should end with /
          url: value.endsWith("/") ? value : `${value}/`,
        },
        pluginId: REST_PLUGIN_ID,
      }),
    ),
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasourcesField);
