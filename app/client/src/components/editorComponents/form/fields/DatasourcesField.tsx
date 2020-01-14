import React from "react";
import CreatableDropdown from "components/designSystems/appsmith/CreatableDropdown";
import { connect } from "react-redux";
import { Field } from "redux-form";
import { AppState } from "reducers";
import { DatasourceDataState } from "reducers/entityReducers/datasourceReducer";
import _ from "lodash";
import { createDatasource } from "actions/datasourcesActions";

interface ReduxStateProps {
  datasources: DatasourceDataState;
}
interface ReduxActionProps {
  createDatasource: (value: string) => void;
}

interface ComponentProps {
  name: string;
  pluginId: string;
}

const DatasourcesField = (
  props: ReduxActionProps & ReduxStateProps & ComponentProps,
) => {
  const options = props.datasources.list
    .filter(r => r.pluginId === props.pluginId)
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
      placeholder="https://<base-url>.com"
      onCreateOption={props.createDatasource}
      format={(value: string) => _.find(options, { value }) || ""}
      parse={(option: { value: string }) => (option ? option.value : null)}
      formatCreateLabel={(value: string) => `Create data source "${value}"`}
      noOptionsMessage={() => "No data sources created"}
    />
  );
};

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  datasources: state.entities.datasources,
});

const mapDispatchToProps = (
  dispatch: any,
  ownProps: ComponentProps,
): ReduxActionProps => ({
  createDatasource: (value: string) =>
    dispatch(
      createDatasource({
        // Datasource name should not end with /
        name: value.endsWith("/") ? value.slice(0, -1) : value,
        datasourceConfiguration: {
          // Datasource url should end with /
          url: value.endsWith("/") ? value : `${value}/`,
        },
        pluginId: ownProps.pluginId,
      }),
    ),
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasourcesField);
