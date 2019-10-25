import React from "react";
import CreatableDropdown from "../canvas/CreatableDropdown";
import { connect } from "react-redux";
import { Field } from "redux-form";
import { AppState } from "../../reducers";
import { ResourceDataState } from "../../reducers/entityReducers/resourcesReducer";
import _ from "lodash";
import { createResource } from "../../actions/resourcesActions";
import { REST_PLUGIN_ID } from "../../constants/ApiEditorConstants";

interface ReduxStateProps {
  resources: ResourceDataState;
}
interface ReduxActionProps {
  createResource: (value: string) => void;
}

interface ComponentProps {
  name: string;
}

const ResourcesField = (
  props: ReduxActionProps & ReduxStateProps & ComponentProps,
) => {
  const options = props.resources.list.map(r => ({
    label: r.resourceConfiguration.url,
    value: r.id,
  }));
  return (
    <Field
      name={props.name}
      component={CreatableDropdown}
      isLoading={props.resources.loading}
      options={options}
      placeholder="Resource"
      onCreateOption={props.createResource}
      format={(value: string) => _.find(options, { value })}
      normalize={(option: { value: string }) => option.value}
    />
  );
};

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  resources: state.entities.resources,
});

const mapDispatchToProps = (dispatch: any): ReduxActionProps => ({
  createResource: (value: string) =>
    dispatch(
      createResource({
        name: value,
        resourceConfiguration: { url: value },
        pluginId: REST_PLUGIN_ID,
      }),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResourcesField);
