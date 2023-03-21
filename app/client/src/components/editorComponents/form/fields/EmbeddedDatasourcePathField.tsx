import type { ChangeEvent } from "react";
import React from "react";
import ReactDOM from "react-dom";
import type { BaseFieldProps, WrappedFieldInputProps } from "redux-form";
import { change, Field, formValueSelector } from "redux-form";
import type { EditorProps } from "components/editorComponents/CodeEditor";
import CodeEditor from "components/editorComponents/CodeEditor";
import { CodeEditorBorder } from "components/editorComponents/CodeEditor/EditorConfig";
import type { AppState } from "@appsmith/reducers";
import { connect } from "react-redux";
import get from "lodash/get";
import merge from "lodash/merge";
import type { EmbeddedRestDatasource, Datasource } from "entities/Datasource";
import { DEFAULT_DATASOURCE } from "entities/Datasource";
import CodeMirror from "codemirror";
import type {
  EditorTheme,
  HintHelper,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  EditorModes,
  TabBehaviour,
  EditorSize,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { bindingMarker } from "components/editorComponents/CodeEditor/MarkHelpers/bindingMarker";

import { entityMarker } from "components/editorComponents/CodeEditor/MarkHelpers/entityMarker";
import { bindingHint } from "components/editorComponents/CodeEditor/hintHelpers";
import StoreAsDatasource from "components/editorComponents/StoreAsDatasource";
import { urlGroupsRegexExp } from "constants/AppsmithActionConstants/ActionConstants";
import styled from "styled-components";
import { Text, FontWeight, TextType } from "design-system-old";
import { getDatasourceInfo } from "pages/Editor/APIEditor/ApiRightPane";
import * as FontFamilies from "constants/Fonts";
import { AuthType } from "entities/Datasource/RestAPIForm";

import { getCurrentApplicationId } from "selectors/editorSelectors";
import { Colors } from "constants/Colors";
import { Indices } from "constants/Layers";
import { getExpectedValue } from "utils/validation/common";
import { ValidationTypes } from "constants/WidgetValidation";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getDataTree } from "selectors/dataTreeSelectors";
import type { KeyValuePair } from "entities/Action";
import equal from "fast-deep-equal/es6";
import {
  getDatasource,
  getDatasourcesByPluginId,
} from "selectors/entitiesSelector";
import { extractApiUrlPath } from "transformers/RestActionTransformer";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import {
  hasCreateDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";

type ReduxStateProps = {
  workspaceId: string;
  datasource: Datasource | EmbeddedRestDatasource;
  datasourceList: Datasource[];
  applicationId?: string;
  dataTree: DataTree;
  actionName: string;
  formName: string;
  userWorkspacePermissions: string[];
};

type ReduxDispatchProps = {
  updateDatasource: (datasource: Datasource | EmbeddedRestDatasource) => void;
};

type Props = EditorProps &
  ReduxStateProps &
  ReduxDispatchProps & {
    input: Partial<WrappedFieldInputProps>;
    pluginId: string;
    codeEditorVisibleOverflow: boolean; // this variable adds a custom style to the codeEditor when focused.
  };

const DatasourceContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  height: 35px;
  .t--datasource-editor {
    background-color: ${Colors.WHITE};
    .cm-s-duotone-light.CodeMirror {
      background: ${Colors.WHITE};
    }
    .CodeEditorTarget {
      z-index: ${Indices.Layer5};
    }
  }

  .t--store-as-datasource {
    margin-left: 10px;
  }
`;

const CustomToolTip = styled.span<{ width?: number }>`
  visibility: hidden;
  text-align: left;
  padding: 10px 12px;
  border-radius: 0px;
  background-color: ${Colors.CODE_GRAY};
  color: ${Colors.ALABASTER_ALT};
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1);

  position: absolute;
  z-index: 1000;
  bottom: 125%;
  left: calc(-10px + ${(props) => (props.width ? props.width / 2 : 0)}px);
  margin-left: -60px;

  opacity: 0;
  transition: opacity 0.01s 1s ease-in;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    height: 14px;
    width: 14px;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: ${Colors.CODE_GRAY} transparent transparent transparent;
  }

  &.highlighter {
    visibility: visible;
    opacity: 1;
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

class EmbeddedDatasourcePathComponent extends React.Component<
  Props,
  { highlightedElementWidth: number }
> {
  constructor(props: Props) {
    super(props);
    this.state = { highlightedElementWidth: 0 };
  }

  handleDatasourceUrlUpdate = (datasourceUrl: string) => {
    const { datasource, pluginId, workspaceId } = this.props;
    const urlHasUpdated =
      datasourceUrl !== datasource.datasourceConfiguration?.url;
    if (urlHasUpdated) {
      const isDatasourceRemoved =
        datasourceUrl.indexOf(datasource.datasourceConfiguration?.url) === -1;
      let newDatasource = isDatasourceRemoved
        ? { ...DEFAULT_DATASOURCE(pluginId, workspaceId) }
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
                    text: datasource.datasourceConfiguration?.url,
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

  handleEvaluatedValue = () => {
    const { actionName, datasource, dataTree } = this.props;
    const entity = dataTree[actionName];

    if (!entity) return "";

    if ("ENTITY_TYPE" in entity && entity.ENTITY_TYPE === ENTITY_TYPE.ACTION) {
      let evaluatedPath = "path" in entity.config ? entity.config.path : "";

      if (evaluatedPath && evaluatedPath.indexOf("?") > -1) {
        evaluatedPath = extractApiUrlPath(evaluatedPath);
      }
      const evaluatedQueryParameters = entity.config.queryParameters
        ?.filter((p: KeyValuePair) => p.key)
        .map(
          (p: KeyValuePair, i: number) =>
            `${i === 0 ? "?" : "&"}${p.key}=${p.value}`,
        )
        .join("");

      // When Api is generated from a datasource,
      // url is gotten from the datasource's configuration

      const evaluatedDatasourceUrl =
        "id" in datasource
          ? datasource.datasourceConfiguration?.url
          : entity.datasourceUrl;

      const fullDatasourceUrlPath =
        evaluatedDatasourceUrl + evaluatedPath + evaluatedQueryParameters;

      return fullDatasourceUrlPath;
    }
    return "";
  };

  // handles when user's mouse enters the highlighted component
  handleMouseEnter = (event: MouseEvent) => {
    if (
      this.state.highlightedElementWidth !==
      (event.currentTarget as HTMLElement).getBoundingClientRect()?.width
    ) {
      this.setState({
        highlightedElementWidth: (
          event.currentTarget as HTMLElement
        ).getBoundingClientRect()?.width,
      });
    }
    // add class to trigger custom tooltip to show when mouse enters the component
    document.getElementById("custom-tooltip")?.classList.add("highlighter");
  };

  // handles when user's mouse leaves the highlighted component
  handleMouseLeave = () => {
    // remove class to trigger custom tooltip to not show when mouse leaves the component.
    document.getElementById("custom-tooltip")?.classList.remove("highlighter");
  };

  // if the next props is not equal to the current props, do not rerender, same for state
  shouldComponentUpdate(nextProps: any, nextState: any) {
    if (!equal(nextProps, this.props)) {
      return true;
    }
    if (!equal(nextState, this.state)) {
      return true;
    }
    return false;
  }

  render() {
    const {
      codeEditorVisibleOverflow,
      datasource,
      input: { value },
      userWorkspacePermissions,
    } = this.props;
    const datasourceUrl = get(datasource, "datasourceConfiguration.url", "");
    const displayValue = `${datasourceUrl}${value}`;
    const input = {
      ...this.props.input,
      value: displayValue,
      onChange: this.handleOnChange,
    };

    const shouldSave = datasource && !("id" in datasource);

    const canCreateDatasource = hasCreateDatasourcePermission(
      userWorkspacePermissions,
    );

    const datasourcePermissions = datasource?.userPermissions || [];

    const canManageDatasource = hasManageDatasourcePermission(
      datasourcePermissions,
    );

    const isEnabled =
      (shouldSave && canCreateDatasource) ||
      (!shouldSave && canManageDatasource);

    const props: EditorProps = {
      ...this.props,
      input,
      mode: EditorModes.TEXT_WITH_BINDING,
      theme: this.props.theme,
      tabBehaviour: TabBehaviour.INPUT,
      size: EditorSize.COMPACT,
      marking: [bindingMarker, this.handleDatasourceHighlight(), entityMarker],
      hinting: [bindingHint, this.handleDatasourceHint()],
      showLightningMenu: false,
      fill: true,
      expected: getExpectedValue({ type: ValidationTypes.SAFE_URL }),
      codeEditorVisibleOverflow,
      showCustomToolTipForHighlightedText: true,
      highlightedTextClassName: "datasource-highlight",
      handleMouseEnter: this.handleMouseEnter,
      handleMouseLeave: this.handleMouseLeave,
    };

    return (
      <DatasourceContainer data-replay-id={btoa(props.input.name || "")}>
        <CodeEditor
          {...props}
          border={CodeEditorBorder.ALL_SIDE}
          className="t--datasource-editor"
          evaluatedValue={this.handleEvaluatedValue()}
          focusElementName={`${this.props.actionName}.url`}
        />
        {datasource && datasource.name !== "DEFAULT_REST_DATASOURCE" && (
          <CustomToolTip
            id="custom-tooltip"
            width={this.state.highlightedElementWidth}
          >
            <Text
              color={Colors.ALABASTER_ALT}
              style={{ fontSize: "10px", display: "block", fontWeight: 600 }}
              type={TextType.SIDE_HEAD}
              weight={FontWeight.BOLD}
            >
              Datasource
            </Text>{" "}
            <Text
              color={Colors.ALABASTER_ALT}
              style={{ display: "block" }}
              type={TextType.P3}
            >
              {" "}
              {datasource?.name}{" "}
            </Text>
          </CustomToolTip>
        )}
        {displayValue && (
          <StoreAsDatasource
            datasourceId={
              datasource && "id" in datasource ? datasource.id : undefined
            }
            enable={isEnabled}
            shouldSave={shouldSave}
          />
        )}
      </DatasourceContainer>
    );
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: { pluginId: string; actionName: string; formName: string },
): ReduxStateProps => {
  const apiFormValueSelector = formValueSelector(ownProps.formName);
  const datasourceFromAction = apiFormValueSelector(state, "datasource");
  let datasourceMerged = datasourceFromAction || {};
  // Todo: fix this properly later in #2164
  if (datasourceFromAction && "id" in datasourceFromAction) {
    const datasourceFromDataSourceList = getDatasource(
      state,
      datasourceFromAction.id,
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
    workspaceId: state.ui.workspaces.currentWorkspace.id,
    datasource: datasourceMerged,
    datasourceList: getDatasourcesByPluginId(state, ownProps.pluginId),
    applicationId: getCurrentApplicationId(state),
    dataTree: getDataTree(state),
    actionName: ownProps.actionName,
    formName: ownProps.formName,
    userWorkspacePermissions:
      getCurrentAppWorkspace(state)?.userPermissions ?? [],
  };
};

const mapDispatchToProps = (
  dispatch: any,
  ownProps: any,
): ReduxDispatchProps => ({
  updateDatasource: (datasource) =>
    dispatch(change(ownProps.formName, "datasource", datasource)),
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
    actionName: string;
    codeEditorVisibleOverflow?: boolean;
    formName: string;
  },
) {
  return (
    <Field component={EmbeddedDatasourcePathConnectedComponent} {...props} />
  );
}

export default EmbeddedDatasourcePathField;
