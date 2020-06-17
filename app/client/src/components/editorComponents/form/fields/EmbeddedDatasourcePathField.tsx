import React, { ChangeEvent } from "react";
import {
  Field,
  BaseFieldProps,
  WrappedFieldInputProps,
  formValueSelector,
  change,
} from "redux-form";
import DynamicAutocompleteInput, {
  DynamicAutocompleteInputProps,
} from "components/editorComponents/CodeEditor/DynamicAutocompleteInput";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { AppState } from "reducers";
import { connect } from "react-redux";
import { Datasource } from "api/DatasourcesApi";
import _ from "lodash";
import { DEFAULT_DATASOURCE, EmbeddedDatasource } from "entities/Datasource";
import CodeMirror from "codemirror";

type ReduxStateProps = {
  datasource: Datasource | EmbeddedDatasource;
  datasourceList: Datasource[];
};

type ReduxDispatchProps = {
  updateDatasource: (datasource: Datasource | EmbeddedDatasource) => void;
};

type Props = DynamicAutocompleteInputProps &
  ReduxStateProps &
  ReduxDispatchProps & {
    input: Partial<WrappedFieldInputProps>;
    pluginId: string;
  };

const fullPathRegexExp = /(https?:\/{2}\S+)(\/\S*?)$/;

class EmbeddedDatasourcePathComponent extends React.Component<Props> {
  handleDatasourceUrlUpdate = (datasourceUrl: string) => {
    const { datasource, pluginId, datasourceList } = this.props;
    const urlHasUpdated =
      datasourceUrl !== datasource.datasourceConfiguration?.url;
    if (urlHasUpdated) {
      if ("id" in datasource && datasource.id) {
        this.props.updateDatasource({
          ...DEFAULT_DATASOURCE(pluginId),
          datasourceConfiguration: {
            ...datasource.datasourceConfiguration,
            url: datasourceUrl,
          },
        });
      } else {
        const matchesExistingDatasource = _.find(
          datasourceList,
          d => d.datasourceConfiguration?.url === datasourceUrl,
        );
        if (matchesExistingDatasource) {
          this.props.updateDatasource(matchesExistingDatasource);
        } else {
          this.props.updateDatasource({
            ...DEFAULT_DATASOURCE(pluginId),
            datasourceConfiguration: {
              ...datasource.datasourceConfiguration,
              url: datasourceUrl,
            },
          });
        }
      }
    }
  };

  handlePathUpdate = (path: string) => {
    const { value, onChange } = this.props.input;
    if (onChange && value !== path) {
      onChange(path);
    }
  };

  parseInputValue = (
    value: string,
  ): { datasourceUrl: string; path: string } => {
    let datasourceUrl = "";
    let path = "";
    const isFullPath = fullPathRegexExp.test(value);
    if (isFullPath) {
      const matches = value.match(fullPathRegexExp);
      if (matches && matches.length) {
        datasourceUrl = `${matches[1]}`;
        path = matches[2];
      }
    } else {
      datasourceUrl = value;
    }
    return {
      datasourceUrl,
      path,
    };
  };

  handleOnChange = (valueOrEvent: ChangeEvent<any> | string) => {
    const value =
      typeof valueOrEvent === "string"
        ? valueOrEvent
        : valueOrEvent.target.value;
    const { path, datasourceUrl } = this.parseInputValue(value);
    console.log({ path, datasourceUrl });
    this.handlePathUpdate(path);
    this.handleDatasourceUrlUpdate(datasourceUrl);
  };

  handleDatasourceHighlight = (editorInstance: CodeMirror.Doc) => {
    const { datasource } = this.props;
    if (
      editorInstance.lineCount() === 1 &&
      datasource &&
      "id" in datasource &&
      datasource.id
    ) {
      const value = editorInstance.getValue();
      const isFullPath = fullPathRegexExp.test(value);
      let end = 0;
      if (isFullPath) {
        const matches = value.match(fullPathRegexExp);
        if (matches && matches.length) {
          end = matches[1].length;
        }
      }
      return {
        from: { ch: 0, line: 0 },
        to: { ch: end, line: 0 },
        options: {
          css:
            "background-color: rgba(104,113,239,0.1); border: 1px solid rgba(104, 113, 239, 0.5); padding: 2px; border-radius: 2px; margin-right: 2px",
          atomic: true,
          inclusiveRight: false,
        },
      };
    } else {
      return {
        from: { ch: 0, line: 0 },
        to: { ch: 0, line: 0 },
        options: {},
      };
    }
  };

  render() {
    const {
      datasource,
      input: { value },
    } = this.props;
    const datasourceUrl = _.get(datasource, "datasourceConfiguration.url", "");
    const displayValue = `${datasourceUrl}${value}`;

    const input = {
      ...this.props.input,
      value: displayValue,
      onChange: this.handleOnChange,
    };

    const props = {
      ...this.props,
      input,
      hints: ["a", "b", "c"],
      highlightText: this.handleDatasourceHighlight,
    };

    return (
      <React.Fragment>
        <DynamicAutocompleteInput {...props} />
      </React.Fragment>
    );
  }
}

const apiFormValueSelector = formValueSelector(API_EDITOR_FORM_NAME);

const mapStateToProps = (
  state: AppState,
  ownProps: { pluginId: string },
): ReduxStateProps => {
  return {
    datasource: apiFormValueSelector(state, "datasource"),
    datasourceList: state.entities.datasources.list.filter(
      d => d.pluginId === ownProps.pluginId,
    ),
  };
};

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  updateDatasource: datasource =>
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", datasource)),
});

const EmbeddedDatasourcePathConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(EmbeddedDatasourcePathComponent);

const EmbeddedDatasourcePathField = (
  props: DynamicAutocompleteInputProps & BaseFieldProps & { pluginId: string },
) => {
  return (
    <Field component={EmbeddedDatasourcePathConnectedComponent} {...props} />
  );
};

export default EmbeddedDatasourcePathField;
