import React from "react";
import { map, get, isArray } from "lodash";
import {
  formatFileSize,
  isHidden,
  isKVArray,
} from "components/formControls/utils";
import log from "loglevel";
import { ComparisonOperationsEnum } from "components/formControls/BaseControl";
import { Text } from "@appsmith/ads";
import { Table } from "@appsmith/ads-old";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { RagDocuments } from "ee/components/formControls/Rag";
import type { Datasource } from "entities/Datasource";
import styled from "styled-components";

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

export interface DatasourceFormRendererProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  section: any;
  currentEnvironment: string;
  datasource: Datasource;
  viewMode: boolean | undefined;
  featureFlags?: FeatureFlags;
}

export default function DatasourceFormRenderer({
  currentEnvironment,
  datasource,
  featureFlags,
  section,
  viewMode,
}: DatasourceFormRendererProps) {
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

          return (
            <DatasourceFormRenderer
              currentEnvironment={currentEnvironment}
              datasource={datasource}
              featureFlags={featureFlags}
              section={section}
              viewMode={viewMode}
            />
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

            if (controlType === "RAG_INTEGRATIONS") {
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
