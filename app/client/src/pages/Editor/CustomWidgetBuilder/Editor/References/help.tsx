import { Button, Text } from "@appsmith/ads";
import styles from "./styles.module.css";
import React from "react";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import { CUSTOM_WIDGET_DOC_URL } from "../../constants";

export default function Help() {
  return (
    <div>
      <Text
        color="#6A7585"
        renderAs="p"
        style={{
          lineHeight: "18px",
        }}
      >
        {createMessage(CUSTOM_WIDGET_FEATURE.referrences.help.message)}
      </Text>
      <Button
        className={styles.marginTop}
        href={CUSTOM_WIDGET_DOC_URL}
        kind="secondary"
        renderAs="a"
        size="md"
        startIcon="book"
        target="_blank"
      >
        {createMessage(CUSTOM_WIDGET_FEATURE.referrences.help.buttonCTA)}
      </Button>
    </div>
  );
}
