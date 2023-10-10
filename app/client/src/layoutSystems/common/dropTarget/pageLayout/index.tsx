import React, { useState } from "react";
import styled from "styled-components";
import { Icon } from "design-system";

import { PAGE_LAYOUTS, createMessage } from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";

const PageLayoutFrame = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  height: 50%;
  justify-content: center;
  align-items: center;
`;

const PageLayoutContainer = styled.div`
  flex-direction: column;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;

  background-color: transparent;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    background-color: ${Colors.WHITE};
    box-shadow: 0px 1px 20px 0px rgba(76, 86, 100, 0.11);
  }
`;

const PageLayoutHeaderText = styled.p`
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  margin-bottom: 16px;
`;

const PageLayoutRowItemTitle = styled.p`
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  font-weight: 500;
`;

const PageLayoutRowItemDescription = styled.p`
  font-size: 12px;
  line-height: 16px;
  text-align: left;
  font-weight: 400;
`;

const PageLayoutOrText = styled.p<{ show: boolean }>`
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  margin: 16px 0px;
  opacity: ${(props) => (props.show ? "1" : "0")}; /* Initially hidden */
  transition: opacity 0.3s ease; /* Add fade-in/fade-out transition */
`;

const PageLayoutDragAndDropText = styled.p<{ show: boolean }>`
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  opacity: ${(props) => (props.show ? "1" : "0")}; /* Initially hidden */
  transition: opacity 0.3s ease; /* Add fade-in/fade-out transition */
`;

const PageLayoutContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  justify-content: center;
  align-items: center;
`;

const PageLayoutContentItem = styled.div`
  padding: 20px;
  text-align: center;
  display: flex;
  padding-vertical: 14px;
  padding-horizontal: 12px;
  border-radius: 4px;
  background: transparent;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(241, 245, 249, 1);
  }
`;

const StyledPageLayoutIcon = styled(Icon)`
  margin-right: 12px;
  width: 48px;
  height: 48px;
`;

const PageLayoutContentItemContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 147px;
`;

const layoutItems = [
  {
    id: 1,
    title: createMessage(PAGE_LAYOUTS.layouts.dashboard.name),
    description: createMessage(PAGE_LAYOUTS.layouts.dashboard.description),
    icon: "workspace",
  },
  {
    id: 2,
    title: createMessage(PAGE_LAYOUTS.layouts.form.name),
    description: createMessage(PAGE_LAYOUTS.layouts.form.description),
    icon: "workspace",
  },
  {
    id: 3,
    title: createMessage(PAGE_LAYOUTS.layouts.recordEdit.name),
    description: createMessage(PAGE_LAYOUTS.layouts.recordEdit.description),
    icon: "workspace",
  },
  {
    id: 4,
    title: createMessage(PAGE_LAYOUTS.layouts.recordDetails.name),
    description: createMessage(PAGE_LAYOUTS.layouts.recordDetails.description),
    icon: "workspace",
  },
];

function PageLayout() {
  const [showText, setShowText] = useState<boolean>(true); // manage "or" text and "Drag and Drop Widgets" text

  return (
    <PageLayoutFrame>
      <PageLayoutContainer
        onMouseEnter={() => setShowText(false)}
        onMouseLeave={() => setShowText(true)}
      >
        <PageLayoutHeaderText>Choose a Page Layout</PageLayoutHeaderText>

        <PageLayoutContentGrid>
          {layoutItems.map((item) => (
            <PageLayoutContentItem key={item.id}>
              <StyledPageLayoutIcon name={item.icon} size="lg" />

              <PageLayoutContentItemContent>
                <PageLayoutRowItemTitle>{item.title}</PageLayoutRowItemTitle>
                <PageLayoutRowItemDescription>
                  {item.description}
                </PageLayoutRowItemDescription>
              </PageLayoutContentItemContent>
            </PageLayoutContentItem>
          ))}
        </PageLayoutContentGrid>
      </PageLayoutContainer>

      <PageLayoutOrText show={showText}>or</PageLayoutOrText>

      <PageLayoutDragAndDropText show={showText}>
        Drag and Drop Widgets
      </PageLayoutDragAndDropText>
    </PageLayoutFrame>
  );
}

export default PageLayout;
