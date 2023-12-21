import React from "react";
import {
  Icon,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  List,
} from "design-system";
import styles from "./styles.module.css";
import type { DebuggerLog } from "../../types";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";

export default function HelpDropdown(props: DebuggerLog) {
  const { args } = props;

  const errorMessage = args?.[0]?.message;

  return (
    <Popover>
      <PopoverTrigger>
        <Button kind="tertiary" size="sm" startIcon="question-line" />
      </PopoverTrigger>
      <PopoverContent className={styles.consoleItemHelpContent}>
        <List
          items={[
            // {
            //   startIcon: <Icon name="book" size="md" />,
            //   title: "Documentation",
            //   onClick: () => {
            //     window.open(`https://docs.appsmith.com/`, "_blank");
            //   },
            //   description: "",
            //   descriptionType: "inline",
            // },
            // {
            //   startIcon: <Icon name="wand" size="md" />,
            //   title: "Troubleshoot with AI",
            //   description: "",
            //   descriptionType: "inline",
            //   onClick: noop,
            // },
            {
              startIcon: <Icon name="snippet" size="md" />,
              title: createMessage(
                CUSTOM_WIDGET_FEATURE.debugger.helpDropdown.stackoverflow,
              ),
              onClick: () => {
                args[0] &&
                  window.open(
                    `https://stackoverflow.com/search?q=${
                      "[javascript] " + errorMessage
                    }}`,
                    "_blank",
                  );
              },
              description: "",
              descriptionType: "inline",
            },
            // {
            //   startIcon: <Icon name="support" size="md" />,
            //   title: "Appsmith Support",
            //   description: "",
            //   descriptionType: "inline",
            //   onClick: noop,
            // },
          ]}
        />
      </PopoverContent>
    </Popover>
  );
}
