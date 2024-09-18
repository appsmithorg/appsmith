import React from "react";

import { Icon } from "../../Icon";
import styles from "./styles.module.css";

const Spinner = () => {
  return <Icon className={styles.spinner} name="loader" size="xSmall" />;
};

Spinner.displayName = "Spinner";

export { Spinner };
