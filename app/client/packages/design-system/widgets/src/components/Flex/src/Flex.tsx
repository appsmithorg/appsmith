import React, { forwardRef } from "react";
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
    style,
    ...rest
  } = props;

  const renderFlex = () => {
    return (
      <div
        className={clsx(className, flexCss({ isHidden, ...rest }))}
        id={id}
        ref={ref}
        style={style}
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
