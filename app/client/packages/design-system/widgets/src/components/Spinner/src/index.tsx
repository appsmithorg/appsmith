import React from "react";

import { Icon, type IconProps } from "../../Icon";
import styles from "./styles.module.css";

interface SpinnerProps {
  size?: Exclude<IconProps["size"], "large">;
}

const Spinner = ({ size = "medium" }: SpinnerProps) => {
  return <Icon className={styles.spinner} name="loader" size={size} />;
};

Spinner.displayName = "Spinner";

export { Spinner };
