import { Datasource } from "entities/Datasource";
import React from "react";
import { map, get, isEmpty } from "lodash";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { isHidden } from "components/formControls/utils";
import log from "loglevel";

const Key = styled.div`
  color: ${Colors.DOVE_GRAY};
  font-size: 14px;
  display: inline-block;
`;

const Value = styled.div`
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  margin-left: 5px;
`;

const ValueWrapper = styled.div`
  display: inline-block;
  margin-left: 10px;
`;

const FieldWrapper = styled.div`
  &:not(first-child) {
    margin-top: 9px;
  }
`;

export const renderDatasourceSection = (
  config: any,
  datasource: Datasource,
): any => {
  return (
    <React.Fragment key={datasource.id}>
      {map(config.children, (section) => {
        if (isHidden(datasource, section.hidden)) return null;
        if ("children" in section) {
          return renderDatasourceSection(section, datasource);
        } else {
          try {
            const { configProperty, controlType, label } = section;
            const reactKey = datasource.id + "_" + label;
            let value = get(datasource, configProperty);

            if (controlType === "KEYVALUE_ARRAY") {
              const configPropertyInfo = configProperty.split("[*].");
              const values = get(datasource, configPropertyInfo[0], null);

              if (values && !isEmpty(values)) {
                const keyValuePair = values[0];
                value = keyValuePair[configPropertyInfo[1]];
              } else {
                value = "";
              }
            }

            if (controlType === "FIXED_KEY_INPUT") {
              return (
                <FieldWrapper key={reactKey}>
                  <Key>{configProperty.key}: </Key>{" "}
                  <Value>{configProperty.value}</Value>
                </FieldWrapper>
              );
            }

            if (controlType === "KEY_VAL_INPUT") {
              return (
                <FieldWrapper key={reactKey}>
                  <Key>{label}</Key>
                  {value &&
                    value.map((val: { key: string; value: string }) => {
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
};
