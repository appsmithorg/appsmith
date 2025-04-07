import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";
import { Text } from "@appsmith/ads";

interface ZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  layout?: "single_column" | "double_column";
  title?: string;
}

const Zone: React.FC<ZoneProps> = ({
  children,
  className,
  layout = "single_column",
  title,
  ...props
}) => {
  const classNames = clsx(styles.zone, className);

  return (
    <>
      {title && (
        <Text isBold kind="heading-s" renderAs="p">
          {title}
        </Text>
      )}
      <div className={classNames} data-layout={layout} {...props}>
        {children}
      </div>
    </>
  );
};

export { Zone };
