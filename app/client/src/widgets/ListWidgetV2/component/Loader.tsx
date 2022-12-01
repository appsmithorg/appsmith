import React from "react";
import styled from "styled-components";
import { range } from "lodash";
import { WIDGET_PADDING } from "constants/WidgetConstants";

type LoaderProps = {
  pageSize: number;
  gridGap?: number;
  templateHeight: number;
};

type LoaderItemProps = Pick<LoaderProps, "templateHeight" | "gridGap">;
type StyledWrapperProps = Pick<LoaderProps, "gridGap">;

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
  margin-bottom: ${({ gridGap = 0 }) => gridGap + WIDGET_PADDING}px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

function LoaderItem({ gridGap, templateHeight }: LoaderItemProps) {
  return (
    <StyledLoaderItem
      className="bp3-card bp3-skeleton"
      gridGap={gridGap}
      templateHeight={templateHeight}
    />
  );
}

function Loader({ gridGap, pageSize, templateHeight }: LoaderProps) {
  return (
    <StyledWrapper>
      {range(pageSize).map((index) => (
        <LoaderItem
          gridGap={gridGap}
          key={index}
          templateHeight={templateHeight}
        />
      ))}
    </StyledWrapper>
  );
}

export default Loader;
