import { Datasource } from "api/DatasourcesApi";
import React from "react";
import { map, get } from "lodash";
import { Colors } from "constants/Colors";
import styled from "styled-components";

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

const FieldWrapper = styled.div`
  margin-top: 9px;
`;

export const renderDatasourceSection = (
  config: any,
  datasource: Datasource | undefined,
): any => {
  return (
    <>
      {map(config.children, (section) => {
        if ("children" in section) {
          return renderDatasourceSection(section, datasource);
        } else {
          try {
            const { label, configProperty, controlType } = section;
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

            if (controlType === "FIXED_KEY_INPUT") {
              return (
                <FieldWrapper>
                  <Key>{configProperty.key}: </Key>{" "}
                  <Value>{configProperty.value}</Value>
                </FieldWrapper>
              );
            }

            if (controlType === "KEY_VAL_INPUT") {
              return (
                <FieldWrapper>
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
                </FieldWrapper>
              );
            }

            return (
              <FieldWrapper>
                <Key>{label}: </Key> <Value>{value}</Value>
              </FieldWrapper>
            );
          } catch (e) {}
        }
      })}
    </>
  );
};
