import React from "react";
import type { Datasource } from "entities/Datasource";
import { map, get, isArray } from "lodash";
import styled from "styled-components";
import { isHidden, isKVArray } from "components/formControls/utils";
import log from "loglevel";
import { ComparisonOperationsEnum } from "components/formControls/BaseControl";
import type { AppState } from "@appsmith/reducers";
import { connect } from "react-redux";
import { getPlugin } from "@appsmith/selectors/entitiesSelector";
import { DB_NOT_SUPPORTED } from "@appsmith/utils/Environments";
import type { PluginType } from "entities/Action";
import { getDefaultEnvId } from "@appsmith/api/ApiUtils";
import { EnvConfigSection } from "@appsmith/components/EnvConfigSection";
import { getCurrentEnvironmentId } from "@appsmith/selectors/environmentSelectors";
import { isMultipleEnvEnabled } from "@appsmith/utils/planHelpers";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";

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
  border-bottom: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-7) 0;
  gap: var(--ads-v2-spaces-4);
  overflow: auto;
  height: 100%;
  width: 100%;
  flex-shrink: 0;
`;

interface RenderDatasourceSectionProps {
  config: any;
  datasource: Datasource;
  viewMode?: boolean;
  showOnlyCurrentEnv?: boolean;
  currentEnv: string;
  isEnvEnabled: boolean;
}
const renderKVArray = (
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
        value: any;
        label: string;
      }>
    > = children.reduce(
      (
        acc,
        { configProperty, label }: { configProperty: string; label: string },
      ) => {
        const configPropertyKey = configProperty.split("[*].")[1];
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
  section: any,
  currentEnvironment: string,
  datasource: Datasource,
  viewMode: boolean | undefined,
) {
  return (
    <React.Fragment key={datasource.id}>
      {map(section.children, (section) => {
        if (
          isHidden(
            datasource.datasourceStorages[currentEnvironment],
            section.hidden,
            undefined,
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
          );
        } else {
          try {
            const { configProperty, controlType, label } = section;
            const customConfigProperty =
              `datasourceStorages.${currentEnvironment}.` + configProperty;
            const reactKey = datasource.id + "_" + label;
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

            if (!value || (isArray(value) && value.length < 1)) {
              return;
            }

            if (isArray(value)) {
              return (
                <FieldWrapper>
                  <Key>{label}: </Key>
                  {value.map(
                    (
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
      return renderDatasourceSection(config, currentEnv, datasource, viewMode);
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
const mapStateToProps = (state: AppState, ownProps: any) => {
  const { datasource } = ownProps;
  const pluginId = datasource.pluginId;
  const plugin = getPlugin(state, pluginId);
  const pluginType = plugin?.type;
  const isEnvEnabled = DB_NOT_SUPPORTED.includes(pluginType as PluginType)
    ? false
    : isMultipleEnvEnabled(selectFeatureFlags(state));
  const currentEnvironmentId = getCurrentEnvironmentId(state);
  return {
    currentEnv: isEnvEnabled ? currentEnvironmentId : getDefaultEnvId(),
    isEnvEnabled,
  };
};

export default connect(mapStateToProps)(RenderDatasourceInformation);
