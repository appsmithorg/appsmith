import React from "react";
import type { Datasource } from "entities/Datasource";
import { map, get, isArray } from "lodash";
import styled from "styled-components";
import {
  formatFileSize,
  isHidden,
  isKVArray,
} from "components/formControls/utils";
import log from "loglevel";
import { ComparisonOperationsEnum } from "components/formControls/BaseControl";
import type { AppState } from "ee/reducers";
import { connect } from "react-redux";
import { getPlugin } from "ee/selectors/entitiesSelector";
import { DB_NOT_SUPPORTED } from "ee/utils/Environments";
import type { PluginType } from "entities/Plugin";
import { getDefaultEnvId } from "ee/api/ApiUtils";
import { EnvConfigSection } from "ee/components/EnvConfigSection";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { isMultipleEnvEnabled } from "ee/utils/planHelpers";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { Text } from "@appsmith/ads";
import { Table } from "@appsmith/ads-old";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { RagDocuments } from "ee/components/formControls/RagDocuments";

const Key = styled.div`
  color: var(--ads-v2-color-fg-muted);
  font-size: 14px;
  display: inline-block;
`;

const Value = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--ads-v2-color-fg);
  display: inline-block;
  margin-left: 5px;
`;

const ValueWrapper = styled.div`
  display: inline-block;
  &:not(:first-child) {
    margin-left: 10px;
  }
`;

const FieldWrapper = styled.div`
  &:first-child {
    margin-top: 9px;
  }
`;

export const ViewModeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--ads-v2-spaces-7) 0;
  gap: var(--ads-v2-spaces-4);
  overflow: auto;
  height: 100%;
  width: 100%;
  flex-shrink: 0;
`;

interface RenderDatasourceSectionProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  datasource: Datasource;
  viewMode?: boolean;
  showOnlyCurrentEnv?: boolean;
  currentEnv: string;
  isEnvEnabled: boolean;
  featureFlags?: FeatureFlags;
}
const renderKVArray = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: Array<any>,
  currentEnvironment: string,
  datasource: Datasource,
) => {
  try {
    // setup config for each child
    const firstConfigProperty =
      `datasourceStorages.${currentEnvironment}.` +
        children[0].configProperty || children[0].configProperty;
    const configPropertyInfo = firstConfigProperty.split("[*].");
    const values = get(datasource, configPropertyInfo[0], null);
    const renderValues: Array<
      Array<{
        key: string;
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any;
        label: string;
      }>
    > = children.reduce(
      (
        acc,
        { configProperty, label }: { configProperty: string; label: string },
      ) => {
        const configPropertyKey = configProperty.split("[*].")[1];

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values.forEach((value: any, index: number) => {
          if (!acc[index]) {
            acc[index] = [];
          }

          acc[index].push({
            key: configPropertyKey,
            label,
            value: value[configPropertyKey],
          });
        });

        return acc;
      },
      [],
    );

    return renderValues.map((renderValue, index: number) => (
      <FieldWrapper key={`${firstConfigProperty}.${index}`}>
        {renderValue.map(({ key, label, value }) => (
          <ValueWrapper key={`${firstConfigProperty}.${key}.${index}`}>
            <Key>{label}: </Key>
            <Value>{value}</Value>
          </ValueWrapper>
        ))}
      </FieldWrapper>
    ));
  } catch (e) {
    return;
  }
};

export function renderDatasourceSection(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  section: any,
  currentEnvironment: string,
  datasource: Datasource,
  viewMode: boolean | undefined,
  featureFlags?: FeatureFlags,
) {
  return (
    <React.Fragment key={datasource.id}>
      {map(section.children, (section) => {
        if (
          isHidden(
            datasource.datasourceStorages[currentEnvironment],
            section.hidden,
            featureFlags,
            viewMode,
          )
        )
          return null;

        if ("children" in section) {
          if (isKVArray(section.children)) {
            return renderKVArray(
              section.children,
              currentEnvironment,
              datasource,
            );
          }

          return renderDatasourceSection(
            section,
            currentEnvironment,
            datasource,
            viewMode,
            featureFlags,
          );
        } else {
          try {
            const {
              configProperty,
              controlType,
              label,
              subtitle = "",
            } = section;
            const customConfigProperty =
              `datasourceStorages.${currentEnvironment}.` + configProperty;
            const reactKey = datasource.id + "_" + label;

            if (controlType === "RAG_DOCUMENTS") {
              return (
                <RagDocuments
                  datasourceId={datasource.id}
                  isDeletedAvailable={false}
                  isImportDataAvailable={false}
                  key={reactKey}
                  workspaceId={datasource.workspaceId}
                />
              );
            }

            if (controlType === "FIXED_KEY_INPUT") {
              return (
                <FieldWrapper key={reactKey}>
                  <Key>{configProperty.key}: </Key>{" "}
                  <Value>{configProperty.value}</Value>
                </FieldWrapper>
              );
            }

            let value = get(datasource, customConfigProperty);

            if (controlType === "DROP_DOWN") {
              if (Array.isArray(section.options)) {
                const option = section.options.find(
                  // TODO: Fix this the next time the file is edited
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (el: any) => el.value === value,
                );

                if (option && option.label) {
                  value = option.label;
                }
              }
            }

            if (
              !value &&
              !!viewMode &&
              (!section.hidden ||
                (!!section.hidden &&
                  "comparison" in section.hidden &&
                  section.hidden.comparison ===
                    ComparisonOperationsEnum.VIEW_MODE))
            ) {
              value = section.initialValue;
            }

            if (controlType === "MULTIPLE_FILE_PICKER") {
              if (value && Array.isArray(value) && value.length > 0) {
                const isPlural = value.length > 1;

                return (
                  <div>
                    <FieldWrapper key={reactKey}>
                      <Key>{label}: </Key>{" "}
                      <Value>
                        {value.length} file{isPlural ? "s" : ""} uploaded
                      </Value>
                    </FieldWrapper>
                    <div className="mt-2 max-w-[50%]">
                      <Table
                        columns={[
                          {
                            Header: "Name",
                            accessor: "name",
                          },
                          {
                            Header: "Size",
                            accessor: "size",
                            // TODO: Fix this the next time the file is edited
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            Cell: (props: any) => formatFileSize(props.value),
                          },
                        ]}
                        data={value}
                      />
                    </div>
                    {section.labelVisibleWithFiles && (
                      <div className="mt-2 max-w-[50%]">
                        <Text kind="body-s">
                          {section.labelVisibleWithFiles}
                        </Text>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div>
                    <FieldWrapper key={reactKey}>
                      <Key>{label}: </Key> No Files Uploaded
                    </FieldWrapper>
                    <Text kind="body-s">{subtitle}</Text>
                  </div>
                );
              }
            }

            if (!value || (isArray(value) && value.length < 1)) {
              return;
            }

            if (isArray(value)) {
              return (
                <FieldWrapper>
                  <Key>{label}: </Key>
                  {value.map(
                    (
                      // TODO: Fix this the next time the file is edited
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      { key, value }: { key: string; value: any },
                      index: number,
                    ) => (
                      <div key={`${reactKey}.${index}`}>
                        <div style={{ display: "inline-block" }}>
                          <Key>Key: </Key>
                          <Value>{key}</Value>
                        </div>
                        <ValueWrapper>
                          <Key>Value: </Key>
                          <Value>{value}</Value>
                        </ValueWrapper>
                      </div>
                    ),
                  )}
                </FieldWrapper>
              );
            }

            return (
              <FieldWrapper key={reactKey}>
                <Key>{label}: </Key> <Value>{value}</Value>
              </FieldWrapper>
            );
          } catch (e) {
            log.error(e);
          }
        }
      })}
    </React.Fragment>
  );
}

class RenderDatasourceInformation extends React.Component<RenderDatasourceSectionProps> {
  render() {
    const {
      config,
      currentEnv,
      datasource,
      featureFlags,
      isEnvEnabled,
      showOnlyCurrentEnv,
      viewMode,
    } = this.props;
    const { datasourceStorages } = datasource;

    if (showOnlyCurrentEnv || !isEnvEnabled) {
      // in this case, we will show the env that is present in datasourceStorages

      if (!datasourceStorages) {
        return null;
      }

      return renderDatasourceSection(
        config,
        currentEnv,
        datasource,
        viewMode,
        featureFlags,
      );
    }

    return (
      <EnvConfigSection
        config={config}
        currentEnv={currentEnv}
        datasource={datasource}
        viewMode={viewMode}
      />
    );
  }
}
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, ownProps: any) => {
  const { datasource } = ownProps;
  const pluginId = datasource.pluginId;
  const plugin = getPlugin(state, pluginId);
  const pluginType = plugin?.type;
  const isEnvEnabled = DB_NOT_SUPPORTED.includes(pluginType as PluginType)
    ? false
    : isMultipleEnvEnabled(selectFeatureFlags(state));
  const currentEnvironmentId = getCurrentEnvironmentId(state);
  const featureFlags = selectFeatureFlags(state);

  return {
    currentEnv: isEnvEnabled ? currentEnvironmentId : getDefaultEnvId(),
    isEnvEnabled,
    featureFlags,
  };
};

export default connect(mapStateToProps)(RenderDatasourceInformation);
