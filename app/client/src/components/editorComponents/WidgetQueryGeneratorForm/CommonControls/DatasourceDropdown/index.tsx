import React from "react";
import { SelectWrapper } from "../../styles";
import { useDatasource } from "./useDatasource";
// import { Select, Option } from "design-system";
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

const Select = styled.div<any>``;
const Option = styled.div<any>``;

function DatasourceDropdown() {
  const { datasourceOptions, otherOptions } = useDatasource();

  return (
    <SelectWrapper>
      <Select
        dropdownStyle={{
          minWidth: "350px",
          maxHeight: "300px",
        }}
        onSelect={(value: string, valueOption: DropdownOptionType) => {
          const option = [...datasourceOptions, ...otherOptions].find(
            (option) => option.id === value,
          );

          option?.onSelect?.(value, valueOption);
        }}
      >
        <Option disabled>
          <SectionHeader>Generate a query</SectionHeader>
        </Option>

        {datasourceOptions.map((option: any) => {
          return (
            <Option key={option.id} value={option.id}>
              <DropdownOption label={option.label} leftIcon={option.icon} />
            </Option>
          );
        })}

        <Option disabled>
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
