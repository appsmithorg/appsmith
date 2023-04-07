import React from "react";
import { SelectWrapper } from "../../styles";
import { useDatasource } from "./useDatasource";
import { Select, Option } from "design-system";
import { DropdownOption } from "../../components/DropdownOption";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const SectionHeader = styled.div`
  cursor: default;
  font-weight: 500;
  line-height: 19px;
  color: ${Colors.GREY_900};
`;

function DatasourceDropdown() {
  const { datasourceOptions, otherOptions } = useDatasource();

  return (
    <SelectWrapper>
      <Select
        dropdownStyle={{
          minWidth: "350px",
          maxHeight: "300px",
        }}
        onSelect={(value) => {
          [...datasourceOptions, ...otherOptions].find((option) => {
            if (option.id === value && option.onSelect) {
              option.onSelect();
            }
          });
        }}
      >
        <Option disabled>
          <SectionHeader>Generate a query</SectionHeader>
        </Option>

        {datasourceOptions.map((option: any) => {
          return (
            <Option
              key={option.id}
              onClick={() => option.onSelect(option)}
              value={option.id}
            >
              <DropdownOption label={option.label} leftIcon={option.icon} />
            </Option>
          );
        })}

        <Option disabled>
          <SectionHeader>Other actions</SectionHeader>
        </Option>

        {otherOptions.map((option: any) => {
          return (
            <Option
              key={option.id}
              onClick={() => option.onSelect(option)}
              value={option.id}
            >
              <DropdownOption label={option.label} leftIcon={option.icon} />
            </Option>
          );
        })}
      </Select>
    </SelectWrapper>
  );
}

export default DatasourceDropdown;
