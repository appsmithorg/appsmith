import React, { useLayoutEffect, useRef, forwardRef } from "react";
import { StyleSheet } from "@emotion/sheet";
import uniqueId from "lodash/uniqueId";
import { flexCssRule } from "./flexCssRule";
import styles from "./styles.module.css";
import clsx from "clsx";

import type { Ref } from "react";
import type { FlexProps } from "./types";

const _Flex = (props: FlexProps, ref: Ref<HTMLDivElement>) => {
  const {
    children,
    className,
    isContainer = false,
    isHidden = false,
    style,
    ...rest
  } = props;

  const flexClassName = useRef(uniqueId("wds-flex-"));
  const sheet = new StyleSheet({
    key: flexClassName.current,
    container: document.head,
    // It is important to use this flag to work with container query
    speedy: false,
  });

  useLayoutEffect(() => {
    sheet.flush();
    sheet.insert(flexCssRule(flexClassName.current, { isHidden, ...rest }));

    return () => {
      sheet.flush();
    };
  }, [isHidden, rest]);

  const renderFlex = () => {
    return (
      <div
        className={clsx(className, flexClassName.current)}
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
