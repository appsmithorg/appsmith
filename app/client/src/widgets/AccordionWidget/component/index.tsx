import { uniqueId } from "lodash";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import ArrowIcon from "../ArrowIcon";

export interface AccordionContainerProps {
  hello?: boolean;
}

const AccordionContainer = styled.div<AccordionContainerProps>`
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: #000000d9;
  font-size: 14px;
  font-variant: tabular-nums;
  line-height: 1.5715;
  list-style: none;
  font-feature-settings: "tnum";
  background-color: #fafafa;
  border: 1px solid #d9d9d9;
  border-bottom: 0;
  border-radius: 2px;
`;

const StyledAccordionItem = styled.div`
  border-bottom: 1px solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface AccordionItemProps {
  handleItemClick: (item: AccordionItem) => void;
  item: AccordionItem;
}

function AccordionItem({ handleItemClick, item }: AccordionItemProps) {
  return (
    <StyledAccordionItem>
      <AccordionTitle onClick={() => handleItemClick(item)}>
        <ArrowIcon />
        <span>{item.title}</span>
      </AccordionTitle>
      {item.isExpanded ? (
        <AccordionContent>{item.content}</AccordionContent>
      ) : null}
    </StyledAccordionItem>
  );
}

const AccordionTitle = styled.div`
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  padding: 12px 16px;
  color: #000000d9;
  line-height: 1.5715;
  cursor: pointer;
`;

const AccordionContent = styled.div`
  color: #000000d9;
  background-color: #fff;
  border-top: 1px solid #d9d9d9;
  padding: 16px;
`;

export interface AccordionItem {
  content: string;
  id: string;
  isExpanded: boolean;
  title: string;
}

export interface AccordionComponentProps extends ComponentProps {
  items: AccordionItem[];
  onChange: (item: AccordionItem) => void;
}

function AccordionComponent(props: AccordionComponentProps) {
  const { items, onChange } = props;

  function handleItemClick(item: AccordionItem) {
    onChange(item);
  }

  return (
    <AccordionContainer>
      {items.map((item, index) => (
        <AccordionItem
          handleItemClick={handleItemClick}
          item={item}
          key={index}
        />
      ))}
    </AccordionContainer>
  );
}

export default AccordionComponent;
