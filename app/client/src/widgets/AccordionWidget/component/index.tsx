import { uniqueId } from "lodash";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";

export interface AccordionContainerProps {
  hello?: boolean;
}

const AccordionContainer = styled.div<AccordionContainerProps>``;

const StyledAccordionItem = styled.div`
  background-color: white;
`;

interface AccordionItemProps {
  handleItemClick: (item: PrivateAccordionItem) => void;
  item: PrivateAccordionItem;
}

function AccordionItem({ handleItemClick, item }: AccordionItemProps) {
  return (
    <StyledAccordionItem>
      <AccordionTitle onClick={() => handleItemClick(item)}>
        {item.title}
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
  title: string;
  content: string;
}

interface PrivateAccordionItem extends AccordionItem {
  id: string;
  isExpanded: boolean;
}

export interface AccordionComponentProps extends ComponentProps {
  items: AccordionItem[];
}

function AccordionComponent(props: AccordionComponentProps) {
  const { items } = props;
  const [accordionItems, updateAccordionItems] = useState<
    PrivateAccordionItem[]
  >([]);

  useEffect(() => {
    updateAccordionItems(
      items.map((item) => ({
        ...item,
        id: uniqueId(),
        isExpanded: false,
      })),
    );
  }, [items]);

  function handleItemClick(item: PrivateAccordionItem) {
    updateAccordionItems(
      accordionItems.map((accordionItem) => {
        if (accordionItem.id === item.id) {
          return {
            ...accordionItem,
            isExpanded: !accordionItem.isExpanded,
          };
        }

        return accordionItem;
      }),
    );
  }

  return (
    <AccordionContainer>
      {accordionItems.map((item, index) => (
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
