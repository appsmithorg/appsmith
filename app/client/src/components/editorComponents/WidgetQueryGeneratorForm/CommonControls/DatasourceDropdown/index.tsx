import React, { memo, useEffect, useState } from "react";
import { Bold, SelectWrapper } from "../../styles";
import { useDatasource } from "./useDatasource";
import { Select, Option, Icon } from "design-system";
import { DropdownOption } from "./DropdownOption";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import type { DropdownOptionType } from "../../types";
import type { DefaultOptionType } from "rc-select/lib/Select";

const SectionHeader = styled.div`
  cursor: default;
  font-weight: 500;
  line-height: 19px;
  color: ${Colors.GREY_900};
`;

function DatasourceDropdown() {
  const {
    datasourceOptions,
    isSourceOpen,
    onSourceClose,
    otherOptions,
    queryOptions,
    selected,
  } = useDatasource();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isSourceOpen);
  }, [isSourceOpen]);

  return (
    <SelectWrapper>
      <Select
        dropdownClassName="one-click-binding-datasource-dropdown"
        dropdownStyle={{
          minWidth: "350px",
          maxHeight: "300px",
        }}
        filterOption={(value: string, option?: DefaultOptionType) => {
          if (
            ["Bind to query", "Generate a query", "Other actions"].includes(
              option?.value as string,
            )
          ) {
            return false;
          } else {
            return (
              !!option?.value &&
              option.value.toString()?.toLocaleLowerCase().indexOf(value) > -1
            );
          }
        }}
        onDropdownVisibleChange={(open: boolean) => {
          !open && onSourceClose();
          setOpen(open);
        }}
        onSelect={(value: string, selectedOption: DefaultOptionType) => {
          const option = [
            ...datasourceOptions,
            ...otherOptions,
            ...queryOptions,
          ].find((option) => option.id === selectedOption.key);

          option?.onSelect?.(value, option as DropdownOptionType);
          onSourceClose();
          setOpen(false);
        }}
        open={open}
        placeholder="Connect data"
        showSearch
        value={selected}
        virtual={false}
      >
        {queryOptions.length && (
          <Option disabled key="Bind to query">
            <SectionHeader>Bind to query</SectionHeader>
          </Option>
        )}

        {queryOptions.map((option) => {
          return (
            <Option key={option.id} value={option.label}>
              <DropdownOption label={option.label} leftIcon={option.icon} />
            </Option>
          );
        })}

        <Option
          className={queryOptions.length && "has-seperator"}
          disabled
          key="Generate a query"
        >
          <SectionHeader>Generate a query</SectionHeader>
        </Option>

        {datasourceOptions.map((option) => {
          return (
            <Option key={option.id} value={option.label}>
              <DropdownOption
                label={
                  <>
                    New from {option.data.isSample ? "sample " : ""}
                    <Bold>{option.label}</Bold>
                  </>
                }
                leftIcon={option.icon}
                rightIcon={<Icon name="add-box-line" size="xxl" />}
              />
            </Option>
          );
        })}

        <Option className="has-seperator" disabled key="Other actions">
          <SectionHeader>Other actions</SectionHeader>
        </Option>

        {otherOptions.map((option: DropdownOptionType) => {
          return (
            <Option key={option.id} value={option.label}>
              <DropdownOption label={option.label} leftIcon={option.icon} />
            </Option>
          );
        })}
      </Select>
    </SelectWrapper>
  );
}

export default memo(DatasourceDropdown);
