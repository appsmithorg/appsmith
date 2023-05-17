import React from "react";
import styled from "styled-components";
import { range } from "lodash";
import { WIDGET_PADDING } from "constants/WidgetConstants";

type LoaderProps = {
  pageSize: number;
  itemSpacing?: number;
  templateHeight: number;
};

type LoaderItemProps = Pick<LoaderProps, "templateHeight" | "itemSpacing">;
type StyledWrapperProps = Pick<LoaderProps, "itemSpacing">;

const StyledWrapper = styled.div<StyledWrapperProps>`
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  box-shadow: 0px 0px 0px 1px #e7e7e7;
`;

const StyledLoaderItem = styled.div<LoaderItemProps>`
  height: ${({ templateHeight }) => templateHeight - WIDGET_PADDING * 2}px;
  margin: ${WIDGET_PADDING}px;
  margin-bottom: ${({ itemSpacing = 0 }) => itemSpacing + WIDGET_PADDING}px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

function LoaderItem({ itemSpacing, templateHeight }: LoaderItemProps) {
  return (
    <StyledLoaderItem
      className="bp3-card bp3-skeleton"
      itemSpacing={itemSpacing}
      templateHeight={templateHeight}
    />
  );
}

function Loader({ itemSpacing, pageSize, templateHeight }: LoaderProps) {
  return (
    <StyledWrapper>
      {range(pageSize).map((index) => (
        <LoaderItem
          itemSpacing={itemSpacing}
          key={index}
          templateHeight={templateHeight}
        />
      ))}
    </StyledWrapper>
  );
}

export default Loader;
