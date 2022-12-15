import { Datasource } from "entities/Datasource";
import React from "react";
import { map, get, isArray } from "lodash";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { isHidden, isKVArray } from "components/formControls/utils";
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

export default class RenderDatasourceInformation extends React.Component<{
  config: any;
  datasource: Datasource;
}> {
  renderKVArray = (children: Array<any>) => {
    try {
      // setup config for each child
      const firstConfigProperty = children[0].configProperty;
      const configPropertyInfo = firstConfigProperty.split("[*].");
      const values = get(this.props.datasource, configPropertyInfo[0], null);
      const renderValues: Array<Array<{
        key: string;
        value: any;
        label: string;
      }>> = children.reduce(
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

  renderDatasourceSection(section: any) {
    const { datasource } = this.props;
    return (
      <React.Fragment key={datasource.id}>
        {map(section.children, (section) => {
          if (isHidden(datasource, section.hidden)) return null;
          if ("children" in section) {
            if (isKVArray(section.children)) {
              return this.renderKVArray(section.children);
            }

            return this.renderDatasourceSection(section);
          } else {
            try {
              const { configProperty, controlType, label } = section;
              const reactKey = datasource.id + "_" + label;

              if (controlType === "FIXED_KEY_INPUT") {
                return (
                  <FieldWrapper key={reactKey}>
                    <Key>{configProperty.key}: </Key>{" "}
                    <Value>{configProperty.value}</Value>
                  </FieldWrapper>
                );
              }

              let value = get(datasource, configProperty);

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

  render() {
    return this.renderDatasourceSection(this.props.config);
  }
}
