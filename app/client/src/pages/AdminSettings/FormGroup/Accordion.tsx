import React, { useState } from "react";
import styled from "styled-components";

import type { Setting } from "ee/pages/AdminSettings/config/types";
import Group from "./group";
import { Icon, Text } from "@appsmith/ads";

const AccordionWrapper = styled.div`
  margin-top: 40px;
  max-width: 40rem;
`;

const AccordionHeader = styled(Text)`
  margin-bottom: ${(props) => props.theme.spaces[9]}px;
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
  border-top: 1px solid var(--ads-v2-color-border);
  margin: 0 16px;
  flex: 1 0 auto;
}
`;

interface AccordionProps {
  label?: React.ReactNode;
  settings?: Setting[];
  isHidden?: boolean;
  category?: string;
  subCategory?: string;
}

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
        <AccordionHeader
          color="var(--ads-v2-color-fg)"
          data-testid="admin-settings-form-group-label"
          kind="heading-s"
          onClick={() => setIsOpen(!isOpen)}
          renderAs="label"
        >
          <span>{label}</span>
          <Line />
          <Icon name={isOpen ? "expand-less" : "expand-more"} size="md" />
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
