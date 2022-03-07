import React, { useState } from "react";
import styled from "styled-components";

import { Setting } from "@appsmith/pages/AdminSettings/config/types";
import { createMessage } from "@appsmith//constants/messages";
import { StyledLabel } from "./Common";
import Group from "./group";
import { Icon, IconSize } from "components/ads";

const AccordionWrapper = styled.div`
  margin-top: 40px;
  max-width: 40rem;
`;

const AccordionHeader = styled(StyledLabel)`
  text-transform: capitalize;
  margin-bottom: ${(props) => props.theme.spaces[9]}px;
  font-size: 20px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccordionBody = styled.div`
  & .hide {
    display: none;
  }
  & .callout-link {
    > div {
      margin-top: 0px;
    }
  }
`;

const Line = styled.hr`
  display: block;
  height: 1px;
  border: 0;
  border-top: 1px solid #DFDFDF;
  margin: 0 16px;
  flex: 1 0 auto;
}
`;

type AccordionProps = {
  label?: string;
  settings?: Setting[];
  isHidden?: boolean;
  category?: string;
  subCategory?: string;
};

export default function Accordion({
  category,
  label,
  settings,
  subCategory,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AccordionWrapper>
      {label && (
        <AccordionHeader onClick={() => setIsOpen(!isOpen)}>
          <span>{createMessage(() => label)}</span>
          <Line />
          <Icon
            name={isOpen ? "expand-less" : "expand-more"}
            size={IconSize.XXL}
          />
        </AccordionHeader>
      )}
      {isOpen && (
        <AccordionBody>
          <Group
            category={category}
            settings={settings}
            subCategory={subCategory}
          />
        </AccordionBody>
      )}
    </AccordionWrapper>
  );
}
