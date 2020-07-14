import React, { ChangeEvent } from "react";
import {
  BaseFieldProps,
  change,
  Field,
  formValueSelector,
  WrappedFieldInputProps,
} from "redux-form";
import CodeEditor, {
  EditorProps,
} from "components/editorComponents/CodeEditor";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { AppState } from "reducers";
import { connect } from "react-redux";
import { Datasource } from "api/DatasourcesApi";
import _ from "lodash";
import { DEFAULT_DATASOURCE, EmbeddedDatasource } from "entities/Datasource";
import CodeMirror from "codemirror";
import {
  EditorModes,
  EditorTheme,
  TabBehaviour,
  EditorSize,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { bindingMarker } from "components/editorComponents/CodeEditor/markHelpers";
import { bindingHint } from "components/editorComponents/CodeEditor/hintHelpers";
import StoreAsDatasource from "components/editorComponents/StoreAsDatasource";
import { urlGroupsRegexExp } from "constants/ActionConstants";

type ReduxStateProps = {
  orgId: string;
  datasource: Datasource | EmbeddedDatasource;
  datasourceList: Datasource[];
};

type ReduxDispatchProps = {
  updateDatasource: (datasource: Datasource | EmbeddedDatasource) => void;
};

type Props = EditorProps &
  ReduxStateProps &
  ReduxDispatchProps & {
    input: Partial<WrappedFieldInputProps>;
    pluginId: string;
  };

class EmbeddedDatasourcePathComponent extends React.Component<Props> {
  handleDatasourceUrlUpdate = (datasourceUrl: string) => {
    const { datasource, pluginId, orgId, datasourceList } = this.props;
    const urlHasUpdated =
      datasourceUrl !== datasource.datasourceConfiguration?.url;
    if (urlHasUpdated) {
      if ("id" in datasource && datasource.id) {
        this.props.updateDatasource({
          ...DEFAULT_DATASOURCE(pluginId, orgId),
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
            ...DEFAULT_DATASOURCE(pluginId, orgId),
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
    const { datasource } = this.props;

    if (value === "") {
      return {
        datasourceUrl: "",
        path: "",
      };
    }
    if ("id" in datasource && datasource.id) {
      const datasourceUrl = datasource.datasourceConfiguration.url;
      if (value.includes(datasourceUrl)) {
        return {
          datasourceUrl,
          path: value.replace(datasourceUrl, ""),
        };
      }
    }

    let datasourceUrl = "";
    let path = "";
    const isFullPath = urlGroupsRegexExp.test(value);
    if (isFullPath) {
      const matches = value.match(urlGroupsRegexExp);
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
    const value: string =
      typeof valueOrEvent === "string"
        ? valueOrEvent
        : valueOrEvent.target.value;
    const { path, datasourceUrl } = this.parseInputValue(value);
    this.handlePathUpdate(path);
    this.handleDatasourceUrlUpdate(datasourceUrl);
  };

  handleDatasourceHighlight = () => {
    const { datasource } = this.props;
    return (editorInstance: CodeMirror.Doc) => {
      if (
        editorInstance.lineCount() === 1 &&
        datasource &&
        "id" in datasource &&
        datasource.id
      ) {
        const end = datasource.datasourceConfiguration.url.length;
        editorInstance.markText(
          { ch: 0, line: 0 },
          { ch: end, line: 0 },
          {
            className: "datasource-highlight",
            atomic: true,
            inclusiveRight: false,
          },
        );
      }
    };
  };

  handleDatasourceHint = () => {
    const { datasourceList } = this.props;
    return () => {
      return {
        showHint: (editor: CodeMirror.Editor) => {
          const value = editor.getValue();
          const parsed = this.parseInputValue(value);
          if (
            parsed.path === "" &&
            !!value &&
            this.props.datasource &&
            !("id" in this.props.datasource)
          ) {
            editor.showHint({
              completeSingle: false,
              hint: () => {
                const list = datasourceList
                  .filter(datasource =>
                    datasource.datasourceConfiguration.url.includes(
                      parsed.datasourceUrl,
                    ),
                  )
                  .map(datasource => ({
                    text: datasource.datasourceConfiguration.url,
                    data: datasource,
                  }));
                const hints = {
                  list,
                  from: { ch: 0, line: 0 },
                  to: editor.getCursor(),
                };
                CodeMirror.on(
                  hints,
                  "pick",
                  (selected: { text: string; data: Datasource }) => {
                    this.props.updateDatasource(selected.data);
                  },
                );
                return hints;
              },
            });
          }
        },
      };
    };
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

    const props: EditorProps = {
      ...this.props,
      input,
      mode: EditorModes.TEXT_WITH_BINDING,
      theme: EditorTheme.LIGHT,
      tabBehaviour: TabBehaviour.INPUT,
      size: EditorSize.COMPACT,
      marking: [bindingMarker, this.handleDatasourceHighlight()],
      hinting: [bindingHint, this.handleDatasourceHint()],
      showLightningMenu: false,
    };
    if (datasource && !("id" in datasource) && !!displayValue) {
      props.rightIcon = <StoreAsDatasource />;
    }

    return (
      <React.Fragment>
        <CodeEditor {...props} />
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
    orgId: state.ui.orgs.currentOrg.id,
    datasource: apiFormValueSelector(state, "datasource"),
    datasourceList: state.entities.datasources.list.filter(
      d => d.pluginId === ownProps.pluginId && d.isValid,
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
  props: BaseFieldProps & { pluginId: string },
) => {
  return (
    <Field component={EmbeddedDatasourcePathConnectedComponent} {...props} />
  );
};

export default EmbeddedDatasourcePathField;
