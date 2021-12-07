import React, { ChangeEvent } from "react";
import ReactDOM from "react-dom";
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
import { CodeEditorBorder } from "components/editorComponents/CodeEditor/EditorConfig";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { AppState } from "reducers";
import { connect } from "react-redux";
import get from "lodash/get";
import merge from "lodash/merge";
import {
  DEFAULT_DATASOURCE,
  EmbeddedRestDatasource,
  Datasource,
} from "entities/Datasource";
import CodeMirror from "codemirror";
import {
  EditorModes,
  EditorTheme,
  TabBehaviour,
  EditorSize,
  HintHelper,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { bindingMarker } from "components/editorComponents/CodeEditor/markHelpers";
import { bindingHint } from "components/editorComponents/CodeEditor/hintHelpers";
import StoreAsDatasource, {
  DatasourceIcon,
} from "components/editorComponents/StoreAsDatasource";
import { urlGroupsRegexExp } from "constants/AppsmithActionConstants/ActionConstants";
import styled from "styled-components";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import history from "utils/history";
import { getDatasourceInfo } from "pages/Editor/APIEditor/ApiRightPane";
import * as FontFamilies from "constants/Fonts";
import { getQueryParams } from "../../../../utils/AppsmithUtils";
import { AuthType } from "entities/Datasource/RestAPIForm";
import { setDatsourceEditorMode } from "actions/datasourceActions";

import { getCurrentApplicationId } from "selectors/editorSelectors";
import { Colors } from "constants/Colors";
import { Indices } from "constants/Layers";

type ReduxStateProps = {
  orgId: string;
  datasource: Datasource | EmbeddedRestDatasource;
  datasourceList: Datasource[];
  currentPageId?: string;
  applicationId?: string;
};

type ReduxDispatchProps = {
  updateDatasource: (datasource: Datasource | EmbeddedRestDatasource) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
};

type Props = EditorProps &
  ReduxStateProps &
  ReduxDispatchProps & {
    input: Partial<WrappedFieldInputProps>;
    pluginId: string;
  };

const DatasourceContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  .t--datasource-editor {
    background-color: ${Colors.WHITE};
    .cm-s-duotone-light.CodeMirror {
      background: ${Colors.WHITE};
    }
    .CodeEditorTarget {
      z-index: ${Indices.Layer5};
    }
  }
`;

const hintContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontFamily: `${FontFamilies.TextFonts}`,
};

const mainContainerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "6px",
};

const datasourceNameStyles: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  color: "#090707",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const datasourceInfoStyles: React.CSSProperties = {
  color: "#716262",
  fontWeight: 400,
  fontSize: "14px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const italicInfoStyles = {
  ...datasourceInfoStyles,
  color: "#000000",
  flexShrink: 0,
  fontStyle: "italic",
};

//Avoiding styled components since ReactDOM.render cannot directly work with it
function CustomHint(props: { datasource: Datasource }) {
  return (
    <div style={hintContainerStyles}>
      <div style={mainContainerStyles}>
        <span style={datasourceNameStyles}>{props.datasource.name}</span>
        <span style={italicInfoStyles}>
          {getDatasourceInfo(props.datasource)}
        </span>
      </div>
      <span style={datasourceInfoStyles}>
        {get(props.datasource, "datasourceConfiguration.url")}
      </span>
    </div>
  );
}

const apiFormValueSelector = formValueSelector(API_EDITOR_FORM_NAME);
class EmbeddedDatasourcePathComponent extends React.Component<Props> {
  handleDatasourceUrlUpdate = (datasourceUrl: string) => {
    const { datasource, orgId, pluginId } = this.props;
    const urlHasUpdated =
      datasourceUrl !== datasource.datasourceConfiguration?.url;
    if (urlHasUpdated) {
      const isDatasourceRemoved =
        datasourceUrl.indexOf(datasource.datasourceConfiguration?.url) === -1;
      let newDatasource = isDatasourceRemoved
        ? { ...DEFAULT_DATASOURCE(pluginId, orgId) }
        : { ...datasource };
      newDatasource = {
        ...newDatasource,
        datasourceConfiguration: {
          ...newDatasource.datasourceConfiguration,
          url: datasourceUrl,
        },
      };
      this.props.updateDatasource(newDatasource);
    }
  };

  handlePathUpdate = (path: string) => {
    const { onChange, value } = this.props.input;
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
    if (datasource && datasource.hasOwnProperty("id")) {
      const datasourceUrl = get(datasource, "datasourceConfiguration.url", "");
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
        datasourceUrl = matches[1];
        path = `${matches[2] || ""}${matches[3] || ""}`;
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
    const { datasourceUrl, path } = this.parseInputValue(value);
    this.handlePathUpdate(path);
    this.handleDatasourceUrlUpdate(datasourceUrl);
  };

  handleDatasourceHighlight = () => {
    const { datasource } = this.props;
    const authType = get(
      datasource,
      "datasourceConfiguration.authentication.authenticationType",
      "",
    );

    const hasError = !get(datasource, "isValid", true);

    let className = "datasource-highlight";

    if (authType === AuthType.OAuth2) {
      className = `${className} ${
        hasError ? "datasource-highlight-error" : "datasource-highlight-success"
      }`;
    }

    return (editorInstance: CodeMirror.Doc) => {
      if (
        editorInstance.lineCount() === 1 &&
        datasource &&
        "id" in datasource &&
        datasource.id
      ) {
        const end = get(datasource, "datasourceConfiguration.url", "").length;
        editorInstance.markText(
          { ch: 0, line: 0 },
          { ch: end, line: 0 },
          {
            className,
            atomic: true,
            inclusiveRight: false,
          },
        );
      }
    };
  };

  handleDatasourceHint = (): HintHelper => {
    const { datasourceList } = this.props;
    return () => {
      return {
        showHint: (editor: CodeMirror.Editor) => {
          const value = editor.getValue();
          const parsed = this.parseInputValue(value);
          if (
            parsed.path === "" &&
            this.props.datasource &&
            !("id" in this.props.datasource)
          ) {
            editor.showHint({
              completeSingle: false,
              hint: () => {
                const list = datasourceList
                  .filter((datasource: Datasource) =>
                    (datasource.datasourceConfiguration?.url || "").includes(
                      parsed.datasourceUrl,
                    ),
                  )
                  .map((datasource: Datasource) => ({
                    text: datasource.datasourceConfiguration.url,
                    data: datasource,
                    className: !datasource.isValid
                      ? "datasource-hint custom invalid"
                      : "datasource-hint custom",
                    render: (element: HTMLElement, self: any, data: any) => {
                      ReactDOM.render(
                        <CustomHint datasource={data.data} />,
                        element,
                      );
                    },
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
            return true;
          }
          return false;
        },
        fireOnFocus: true,
      };
    };
  };

  render() {
    const {
      datasource,
      input: { value },
    } = this.props;
    const datasourceUrl = get(datasource, "datasourceConfiguration.url", "");
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
      theme: this.props.theme,
      tabBehaviour: TabBehaviour.INPUT,
      size: EditorSize.COMPACT,
      marking: [bindingMarker, this.handleDatasourceHighlight()],
      hinting: [bindingHint, this.handleDatasourceHint()],
      showLightningMenu: false,
      fill: true,
    };

    return (
      <DatasourceContainer data-replay-id={btoa(props.input.name || "")}>
        <CodeEditor
          {...props}
          border={CodeEditorBorder.ALL_SIDE}
          className="t--datasource-editor"
        />
        {displayValue && datasource && !("id" in datasource) ? (
          <StoreAsDatasource enable={!!displayValue} />
        ) : datasource && "id" in datasource ? (
          <DatasourceIcon
            enable
            onClick={() => {
              this.props.setDatasourceEditorMode(datasource.id, false);
              history.push(
                DATA_SOURCES_EDITOR_ID_URL(
                  this.props.applicationId,
                  this.props.currentPageId,
                  datasource.id,
                  getQueryParams(),
                ),
              );
            }}
          >
            <Icon name="edit-line" size={IconSize.XXL} />
            <Text type={TextType.P1}>Edit Datasource</Text>
          </DatasourceIcon>
        ) : null}
      </DatasourceContainer>
    );
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: { pluginId: string },
): ReduxStateProps => {
  const datasourceFromAction = apiFormValueSelector(state, "datasource");
  let datasourceMerged = datasourceFromAction;
  // Todo: fix this properly later in #2164
  if (datasourceFromAction && "id" in datasourceFromAction) {
    const datasourceFromDataSourceList = state.entities.datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
    if (datasourceFromDataSourceList) {
      datasourceMerged = merge(
        {},
        datasourceFromAction,
        datasourceFromDataSourceList,
      );
    }
  }

  return {
    orgId: state.ui.orgs.currentOrg.id,
    datasource: datasourceMerged,
    datasourceList: state.entities.datasources.list.filter(
      (d) => d.pluginId === ownProps.pluginId,
    ),
    currentPageId: state.entities.pageList.currentPageId,
    applicationId: getCurrentApplicationId(state),
  };
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateDatasource: (datasource) =>
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", datasource)),
  setDatasourceEditorMode: (id: string, viewMode: boolean) =>
    dispatch(setDatsourceEditorMode({ id, viewMode })),
});

const EmbeddedDatasourcePathConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(EmbeddedDatasourcePathComponent);

function EmbeddedDatasourcePathField(
  props: BaseFieldProps & {
    pluginId: string;
    placeholder?: string;
    theme: EditorTheme;
  },
) {
  return (
    <Field component={EmbeddedDatasourcePathConnectedComponent} {...props} />
  );
}

export default EmbeddedDatasourcePathField;
