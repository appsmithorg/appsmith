import React from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";

const Wrapper = styled.div`
  overflow: auto;
  height: 100%;
  box-shadow: 1px 0px 0px #ededed;
  width: ${(props) => props.theme.homePage.sidebar}px;
  padding-left: 32px;
`;

const StyledFilterItem = styled.div``;

interface FilterItemProps {
  label: string;
}

function FilterItem({ label }: FilterItemProps) {
  return <StyledFilterItem>{label}</StyledFilterItem>;
}

function Filters() {
  const filters: string[] = [
    "Customer Support",
    "Data & Analytics",
    "DevOps",
    "Api",
    "DevOps",
  ];

  return (
    <Wrapper>
      <Text type={TextType.BUTTON_MEDIUM}>FUNCTION</Text>
      {filters.map((filter) => {
        return <FilterItem key={filter} label={filter} />;
      })}
    </Wrapper>
  );
}

export default Filters;
