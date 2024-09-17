import type { ChangeEvent } from "react";
import React from "react";
import ReactDOM from "react-dom";
import type { BaseFieldProps, WrappedFieldInputProps } from "redux-form";
import { change, Field, formValueSelector } from "redux-form";
import type { EditorProps } from "components/editorComponents/CodeEditor";
import { CodeEditorBorder } from "components/editorComponents/CodeEditor/EditorConfig";
import type { AppState } from "ee/reducers";
import { connect } from "react-redux";
import { get, merge } from "lodash";
import type { EmbeddedRestDatasource, Datasource } from "entities/Datasource";
import { DEFAULT_DATASOURCE } from "entities/Datasource";
import type CodeMirror from "codemirror";
import type {
  EditorTheme,
  HintHelper,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  EditorModes,
  TabBehaviour,
  EditorSize,
} from "components/editorComponents/CodeEditor/EditorConfig";

import { entityMarker } from "components/editorComponents/CodeEditor/MarkHelpers/entityMarker";
import { bindingHintHelper } from "components/editorComponents/CodeEditor/hintHelpers";
import StoreAsDatasource from "components/editorComponents/StoreAsDatasource";
import { DATASOURCE_URL_EXACT_MATCH_REGEX } from "constants/AppsmithActionConstants/ActionConstants";
import styled from "styled-components";
import * as FontFamilies from "constants/Fonts";
import { AuthType } from "entities/Datasource/RestAPIForm";

import { getCurrentApplicationId } from "selectors/editorSelectors";
import { Indices } from "constants/Layers";
import { getExpectedValue } from "utils/validation/common";
import { ValidationTypes } from "constants/WidgetValidation";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getDataTree } from "selectors/dataTreeSelectors";
import type { KeyValuePair } from "entities/Action";
import equal from "fast-deep-equal/es6";
import {
  getDatasource,
  getDatasourcesByPluginId,
} from "ee/selectors/entitiesSelector";
import { extractApiUrlPath } from "transformers/RestActionTransformer";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { Text } from "@appsmith/ads";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { getCodeMirrorNamespaceFromEditor } from "utils/getCodeMirrorNamespace";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { isEnvironmentValid } from "ee/utils/Environments";
import { DEFAULT_DATASOURCE_NAME } from "constants/ApiEditorConstants/ApiEditorConstants";
import { isString } from "lodash";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import {
  getHasCreateDatasourcePermission,
  getHasManageDatasourcePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { isGACEnabled } from "ee/utils/planHelpers";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { getDatasourceInfo } from "PluginActionEditor/components/PluginActionForm/utils/getDatasourceInfo";

interface ReduxStateProps {
  workspaceId: string;
  currentEnvironment: string;
  datasource: EmbeddedRestDatasource;
  datasourceList: Datasource[];
  datasourceObject?: Datasource;
  applicationId?: string;
  dataTree: DataTree;
  actionName: string;
  formName: string;
  userWorkspacePermissions: string[];
  isFeatureEnabled: boolean;
}

interface ReduxDispatchProps {
  updateDatasource: (datasource: EmbeddedRestDatasource) => void;
}

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
  height: 36px;
  .t--datasource-editor {
    background-color: var(--ads-v2-color-bg);
    .cm-s-duotone-light.CodeMirror {
      background: var(--ads-v2-color-bg);
    }
    .CodeEditorTarget {
      z-index: ${Indices.Layer5};
    }
  }

  .t--store-as-datasource {
    margin-left: 10px;
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

const StyledTooltip = styled.span<{ width?: number }>`
  visibility: hidden;
  text-align: left;
  background-color: var(--ads-v2-color-bg-emphasis-max);
  border-radius: var(--ads-v2-border-radius);
  box-shadow:
    0 2px 4px -2px rgba(0, 0, 0, 0.06),
    0 4px 8px -2px rgba(0, 0, 0, 0.1);
  color: var(--ads-v2-color-fg-on-emphasis-max);
  font-family: var(--ads-v2-font-family);
  min-height: unset;
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);

  position: absolute;
  z-index: 100000;
  max-width: 300px;
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
    height: 10px;
    width: 10px;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: var(--ads-v2-color-bg-emphasis-max) transparent transparent
      transparent;
  }

  &.highlighter {
    visibility: visible;
    opacity: 1;
  }
`;

//Avoiding styled components since ReactDOM.render cannot directly work with it
function CustomHint(props: {
  currentEnvironment: string;
  datasource: Datasource;
}) {
  return (
    <div style={hintContainerStyles}>
      <div style={mainContainerStyles}>
        <span style={datasourceNameStyles}>{props.datasource.name}</span>
        <span style={italicInfoStyles}>
          {getDatasourceInfo(props.datasource)}
        </span>
      </div>
      <span style={datasourceInfoStyles}>
        {get(
          props.datasource,
          `datasourceStorages.${props.currentEnvironment}.datasourceConfiguration.url`,
        )}
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
      // We are not using datasourceStorages here since EmbeddedDatasources will not have environments
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
    const isCorrectFullURL = DATASOURCE_URL_EXACT_MATCH_REGEX.test(value);
    if (isCorrectFullURL) {
      const matches = value.match(DATASOURCE_URL_EXACT_MATCH_REGEX);
      if (matches && matches.length) {
        datasourceUrl = matches[1];
        path = `${matches[2] || ""}${matches[3] || ""}`;
      }
    } else {
      datasourceUrl = value;
    }

    // if there is a dynamic value in datasource url, make it a path.
    if (isDynamicValue(datasourceUrl)) {
      path = datasourceUrl + path;
      datasourceUrl = "";
    }

    return {
      datasourceUrl,
      path,
    };
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const authType: string = get(
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
        datasource.id &&
        datasource.id !== TEMP_DATASOURCE_ID
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
    const { currentEnvironment, datasourceList } = this.props;
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
                    (
                      datasource.datasourceStorages[currentEnvironment]
                        ?.datasourceConfiguration?.url || ""
                    ).includes(parsed.datasourceUrl),
                  )
                  .map((datasource: Datasource) => ({
                    text: datasource.datasourceStorages[currentEnvironment]
                      ?.datasourceConfiguration?.url,
                    data: datasource,
                    className: !isEnvironmentValid(
                      datasource,
                      currentEnvironment,
                    )
                      ? "datasource-hint custom invalid"
                      : "datasource-hint custom",
                    // TODO: Fix this the next time the file is edited
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    render: (element: HTMLElement, self: any, data: any) => {
                      ReactDOM.render(
                        <CustomHint
                          currentEnvironment={currentEnvironment}
                          datasource={data.data}
                        />,
                        element,
                      );
                    },
                  }));
                const hints = {
                  list,
                  from: { ch: 0, line: 0 },
                  to: editor.getCursor(),
                };

                const CodeMirror = getCodeMirrorNamespaceFromEditor(editor);
                CodeMirror.on(
                  hints,
                  "pick",
                  (selected: { text: string; data: Datasource }) => {
                    this.props.updateDatasource({
                      ...selected.data.datasourceStorages[currentEnvironment],
                      id: selected.data.id,
                      invalids: selected.data.invalids || [],
                      messages: selected.data.messages || [],
                      pluginId: selected.data.pluginId,
                      name: selected.data.name,
                      workspaceId: selected.data.workspaceId,
                    });
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

      if (evaluatedPath) {
        if (isString(evaluatedPath)) {
          if (evaluatedPath.indexOf("?") > -1) {
            evaluatedPath = extractApiUrlPath(evaluatedPath);
          }
        } else {
          evaluatedPath = JSON.stringify(evaluatedPath);
        }
      }

      const evaluatedQueryParameters = entity?.config?.queryParameters
        ?.filter((p: KeyValuePair) => !!p?.key)
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      datasourceObject,
      input: { value },
      isFeatureEnabled,
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
    const isGACFeatureEnabled = isFeatureEnabled;

    const canCreateDatasource = getHasCreateDatasourcePermission(
      isGACFeatureEnabled,
      userWorkspacePermissions,
    );

    const datasourcePermissions = datasourceObject?.userPermissions || [];

    const canManageDatasource = getHasManageDatasourcePermission(
      isFeatureEnabled,
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
      marking: [this.handleDatasourceHighlight(), entityMarker],
      hinting: [bindingHintHelper, this.handleDatasourceHint()],
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
      <DatasourceContainer data-location-id={btoa(props.input.name || "")}>
        <LazyCodeEditor
          {...props}
          border={CodeEditorBorder.ALL_SIDE}
          className="t--datasource-editor"
          evaluatedValue={this.handleEvaluatedValue()}
          focusElementName={`${this.props.actionName}.url`}
        />
        {datasourceObject &&
          datasourceObject.name !== DEFAULT_DATASOURCE_NAME && (
            <StyledTooltip
              id="custom-tooltip"
              width={this.state.highlightedElementWidth}
            >
              <Text
                color="var(--ads-v2-color-fg-on-emphasis-max)"
                kind="body-s"
              >
                {`Datasource ${datasourceObject?.name}`}
              </Text>
            </StyledTooltip>
          )}
        {displayValue && (
          <StoreAsDatasource
            datasourceId={
              datasourceObject && "id" in datasourceObject
                ? datasourceObject.id
                : undefined
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
  ownProps: {
    pluginId: string;
    actionName: string;
    formName: string;
    isFeatureEnabled: boolean;
  },
): ReduxStateProps => {
  const apiFormValueSelector = formValueSelector(ownProps.formName);
  const datasourceFromAction = apiFormValueSelector(state, "datasource");
  let datasourceMerged = datasourceFromAction || {};
  let datasourceFromDataSourceList: Datasource | undefined;
  const currentEnvironment = getCurrentEnvironmentId(state);
  const featureFlags = selectFeatureFlags(state);
  const isFeatureEnabled = isGACEnabled(featureFlags);
  // Todo: fix this properly later in #2164
  if (datasourceFromAction && "id" in datasourceFromAction) {
    datasourceFromDataSourceList = getDatasource(
      state,
      datasourceFromAction.id,
    );
    if (datasourceFromDataSourceList) {
      datasourceMerged = merge(
        {},
        datasourceFromAction,
        datasourceFromDataSourceList.datasourceStorages[currentEnvironment],
      );
    }
  }

  return {
    workspaceId: state.ui.selectedWorkspace.workspace.id,
    currentEnvironment,
    datasource: datasourceMerged,
    datasourceList: getDatasourcesByPluginId(state, ownProps.pluginId),
    datasourceObject: datasourceFromDataSourceList,
    applicationId: getCurrentApplicationId(state),
    dataTree: getDataTree(state),
    actionName: ownProps.actionName,
    formName: ownProps.formName,
    userWorkspacePermissions:
      getCurrentAppWorkspace(state)?.userPermissions ?? [],
    isFeatureEnabled: isFeatureEnabled,
  };
};

const mapDispatchToProps = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
