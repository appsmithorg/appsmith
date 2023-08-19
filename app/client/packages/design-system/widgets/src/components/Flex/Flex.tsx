import React, { forwardRef } from "react";
import { StyledContainerFlex, StyledFlex } from "./index.styled";
import type { FlexProps } from "./types";

const _Flex = (props: FlexProps, ref: React.Ref<HTMLDivElement>) => {
  const {
    alignContent,
    alignItems,
    alignSelf,
    children,
    columnGap,
    direction,
    flex,
    flexBasis,
    flexGrow,
    flexShrink,
    gap,
    height,
    id,
    isContainer = false,
    isHidden = false,
    justifyContent,
    justifySelf,
    margin,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    order,
    padding,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    rowGap,
    width,
    wrap,
  } = props;

  const renderFlex = () => {
    return (
      <StyledFlex
        $alignContent={alignContent}
        $alignItems={alignItems}
        $alignSelf={alignSelf}
        $columnGap={columnGap}
        $direction={direction}
        $flex={flex}
        $flexBasis={flexBasis}
        $flexGrow={flexGrow}
        $flexShrink={flexShrink}
        $gap={gap}
        $height={height}
        $isHidden={isHidden}
        $justifyContent={justifyContent}
        $justifySelf={justifySelf}
        $margin={margin}
        $marginBottom={marginBottom}
        $marginLeft={marginLeft}
        $marginRight={marginRight}
        $marginTop={marginTop}
        $maxHeight={maxHeight}
        $maxWidth={maxWidth}
        $minHeight={minHeight}
        $minWidth={minWidth}
        $order={order}
        $padding={padding}
        $paddingBottom={paddingBottom}
        $paddingLeft={paddingLeft}
        $paddingRight={paddingRight}
        $paddingTop={paddingTop}
        $rowGap={rowGap}
        $width={width}
        $wrap={wrap}
        id={id}
        ref={ref}
      >
        {children}
      </StyledFlex>
    );
  };

  return (
    <>
      {isContainer && <StyledContainerFlex>{renderFlex()}</StyledContainerFlex>}
      {!isContainer && <>{renderFlex()}</>}
    </>
  );
};

export const Flex = forwardRef(_Flex);
