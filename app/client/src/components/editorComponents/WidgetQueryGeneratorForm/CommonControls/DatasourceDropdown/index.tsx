import React, { useEffect, useState } from "react";
import { Bold, SelectWrapper } from "../../styles";
import { useDatasource } from "./useDatasource";
import { Select, Option, Icon } from "design-system";
import { DropdownOption } from "../../components/DropdownOption";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import type { DropdownOptionType } from "../../types";

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
        onDropdownVisibleChange={(open: boolean) => {
          !open && onSourceClose();
          setOpen(open);
        }}
        onSelect={(value: string) => {
          const option = [
            ...datasourceOptions,
            ...otherOptions,
            ...queryOptions,
          ].find((option) => option.id === value);

          option?.onSelect?.(value, option as DropdownOptionType);
          onSourceClose();
          setOpen(false);
        }}
        open={open}
        value={selected}
        virtual={false}
      >
        {queryOptions.length && (
          <Option disabled key="Bind to query">
            <SectionHeader>Bind to query</SectionHeader>
          </Option>
        )}

        {queryOptions.map((option: any) => {
          return (
            <Option key={option.id} value={option.id}>
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

        {datasourceOptions.map((option: any) => {
          return (
            <Option key={option.id} value={option.id}>
              <DropdownOption
                label={
                  <>
                    New from <Bold>{option.label}</Bold>
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

        {otherOptions.map((option: any) => {
          return (
            <Option key={option.id} value={option.id}>
              <DropdownOption label={option.label} leftIcon={option.icon} />
            </Option>
          );
        })}
      </Select>
    </SelectWrapper>
  );
}

export default DatasourceDropdown;
