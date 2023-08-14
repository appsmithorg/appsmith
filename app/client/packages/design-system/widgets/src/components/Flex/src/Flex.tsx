import React from "react";
import { flexCss, flexContainerCss } from "./index.styled";
import type { FlexProps } from "./types";
import { cx } from "@emotion/css";

export const Flex = (props: FlexProps) => {
  const {
    children,
    className,
    isContainer = false,
    isHidden = false,
    style,
    ...rest
  } = props;

  const renderFlex = () => {
    return (
      <div
        className={cx(className, flexCss({ isHidden, ...rest }))}
        style={style}
      >
        {children}
      </div>
    );
  };

  return (
    <>
      {isContainer && <div className={flexContainerCss}>{renderFlex()}</div>}
      {!isContainer && <>{renderFlex()}</>}
    </>
  );
};
