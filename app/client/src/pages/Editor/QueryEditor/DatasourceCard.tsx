import { Datasource } from "api/DatasourcesApi";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import React from "react";
import { isNil, map, get } from "lodash";
import { useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import {
  getPluginImages,
  getQueryActionsForCurrentPage,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { AppState } from "reducers";

const Wrapper = styled.div`
  border: 2px solid #d6d6d6;
  padding: 18px;
  margin-top: 18px;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 120px;
    min-height: 36px;
  }
`;

const DatasourceImage = styled.img`
  height: 24px;
  width: auto;
`;

const Key = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: inline-block;
`;

const Value = styled.div`
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  text-transform: uppercase;
  margin-left: 5px;
`;

const ValueWrapper = styled.div`
  display: inline-block;
  margin-left: 10px;
`;

const DatasourceName = styled.span`
  margin-left: 10px;
  font-size: 16px;
  font-weight: 500;
`;

const DatasourceCardHeader = styled.div`
  justify-content: space-between;
  display: flex;
`;

const DatasourceNameWrapper = styled.div`
  flex-direction: row;
  align-items: center;
  display: flex;
`;

const Queries = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: inline-block;
  margin-top: 11px;
`;

type DatasourceCardProps = {
  datasource: Datasource;
  onCreateQuery: (datasource: Datasource) => void;
};

const DatasourceCard = (props: DatasourceCardProps) => {
  const pluginImages = useSelector(getPluginImages);
  const { datasource } = props;
  const datasourceFormConfigs = useSelector(
    (state: AppState) => state.entities.plugins.formConfigs,
  );
  const queryActions = useSelector(getQueryActionsForCurrentPage);
  const queriesWithThisDatasource = queryActions.filter(
    action => action.config.datasource.id === datasource.id,
  ).length;

  const currentFormConfig: Array<any> =
    datasourceFormConfigs[datasource?.pluginId ?? ""];

  return (
    <Wrapper>
      <DatasourceCardHeader>
        <div>
          <DatasourceNameWrapper>
            <DatasourceImage
              src={pluginImages[datasource.pluginId]}
              className="dataSourceImage"
              alt="Datasource"
            />
            <DatasourceName>{datasource.name}</DatasourceName>
          </DatasourceNameWrapper>
          <Queries>
            {queriesWithThisDatasource
              ? `${queriesWithThisDatasource} query on this page`
              : ""}
          </Queries>
        </div>
        <ActionButton
          icon={"plus"}
          text="New Query"
          filled
          accent="primary"
          onClick={() => props.onCreateQuery(datasource)}
        />
      </DatasourceCardHeader>
      {!isNil(currentFormConfig)
        ? renderSection(currentFormConfig[0], datasource)
        : undefined}
    </Wrapper>
  );
};

const renderSection = (
  section: any,
  datasource: Datasource | undefined,
): any => {
  return (
    <>
      {map(section.children, subSection => {
        if ("children" in subSection) {
          return renderSection(subSection, datasource);
        } else {
          try {
            const { label, configProperty, controlType } = subSection;
            let value = get(datasource, configProperty);

            if (controlType === "KEYVALUE_ARRAY") {
              const configPropertyInfo = configProperty.split("[*].");
              const values = get(datasource, configPropertyInfo[0], null);

              if (values) {
                const keyValuePair = values[0];
                value = keyValuePair[configPropertyInfo[1]];
              } else {
                value = "";
              }
            }

            if (controlType === "KEY_VAL_INPUT") {
              return (
                <div style={{ marginTop: 9 }}>
                  <Key>{label}</Key>
                  {value.map((val: { key: string; value: string }) => {
                    return (
                      <div key={val.key}>
                        <div style={{ display: "inline-block" }}>
                          <Key>Key: </Key>
                          <Value>{val.key}</Value>
                        </div>
                        <ValueWrapper>
                          <Key>Value: </Key>
                          <Value>{val.value}</Value>
                        </ValueWrapper>
                      </div>
                    );
                  })}
                </div>
              );
            }

            return (
              <div style={{ marginTop: 9 }}>
                <Key>{label}: </Key> <Value>{value}</Value>
              </div>
            );
          } catch (e) {}
        }
      })}
    </>
  );
};

export default DatasourceCard;
