import React, { forwardRef } from "react";
import { filterDataProps } from "../../../utils";
import { flexCss } from "./flexCss";
import styles from "./styles.module.css";
import clsx from "clsx";

import type { Ref } from "react";
import type { FlexProps } from "./types";

const _Flex = (props: FlexProps, ref: Ref<HTMLDivElement>) => {
  const {
    children,
    className,
    id,
    isContainer = false,
    isHidden = false,
    onClick,
    onClickCapture,
    style,
    ...rest
  } = props;

  const dataProps = filterDataProps(rest);

  const renderFlex = () => {
    return (
      <div
        className={clsx(className, flexCss({ isHidden, ...rest }))}
        id={id}
        onClick={onClick}
        onClickCapture={onClickCapture}
        ref={ref}
        style={style}
        {...dataProps}
      >
        {children}
      </div>
    );
  };

  return (
    <>
      {isContainer && (
        <div className={styles.flexContainer}>{renderFlex()}</div>
      )}
      {!isContainer && <>{renderFlex()}</>}
    </>
  );
};

export const Flex = forwardRef(_Flex);
