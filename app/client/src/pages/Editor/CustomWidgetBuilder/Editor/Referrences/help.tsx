import { Button, Text } from "design-system";
import styles from "./styles.module.css";
import React from "react";

export default function Help() {
  return (
    <div>
      <Text color="#6A7585" renderAs="p">
        Learn how custom widgets work, and how to access data from the rest of
        your app within this widget.
      </Text>
      <Button
        className={styles.marginTop}
        kind="secondary"
        size="md"
        startIcon="book"
      >
        Documentation
      </Button>
    </div>
  );
}
