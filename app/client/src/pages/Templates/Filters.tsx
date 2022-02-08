import React, { useState } from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";

const Wrapper = styled.div`
  overflow: auto;
  height: 100%;
  box-shadow: 1px 0px 0px #ededed;
  width: ${(props) => props.theme.homePage.sidebar}px;
  padding-left: 32px;
  padding-top: 34px;
`;

const StyledFilterItem = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-left: 10px;
  padding: 7px 15px 7px 10px;
  ${(props) => props.selected && `background-color: #ebebeb;`}

  &:hover {
    background-color: #ebebeb;
  }
`;

const StyledFilterCategory = styled(Text)`
  margin-bottom: 10px;
`;

const ListWrapper = styled.div`
  margin-top: 10px;
`;

interface FilterItemProps {
  label: string;
}

function FilterItem({ label }: FilterItemProps) {
  const [selected, setSelected] = useState(false);

  const onClick = () => {
    setSelected((selected) => !selected);
  };

  return (
    <StyledFilterItem onClick={onClick} selected={selected}>
      <Text type={TextType.P1}>{label}</Text>
      {selected && <Icon name={"close-x"} size={IconSize.SMALL} />}
    </StyledFilterItem>
  );
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
      <StyledFilterCategory type={TextType.BUTTON_MEDIUM}>
        FUNCTION
      </StyledFilterCategory>
      <ListWrapper>
        {filters.map((filter) => {
          return <FilterItem key={filter} label={filter} />;
        })}
      </ListWrapper>
    </Wrapper>
  );
}

export default Filters;
