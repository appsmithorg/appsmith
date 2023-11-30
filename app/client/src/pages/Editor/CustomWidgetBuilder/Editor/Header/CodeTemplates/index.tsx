import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "design-system";
import React, { useContext } from "react";
import codeTemplates from "./templates";
import { CustomWidgetBuilderContext } from "pages/Editor/CustomWidgetBuilder";
import styles from "../styles.module.css";

export function CodeTemplates() {
  const { bulkUpdate, initialSrcDoc, lastSaved } = useContext(
    CustomWidgetBuilderContext,
  );
  return (
    <div className={styles.templateMenu}>
      <Menu>
        <MenuTrigger>
          <Button
            kind="secondary"
            size="sm"
            startIcon="code"
            style={{
              height: "32px",
            }}
          >
            Templates
          </Button>
        </MenuTrigger>
        <MenuContent>
          {initialSrcDoc && lastSaved && (
            <>
              <MenuItem onClick={() => bulkUpdate?.(initialSrcDoc)}>
                Revert to Original
              </MenuItem>
              <MenuSeparator />
            </>
          )}
          {codeTemplates.map((template) => (
            <MenuItem
              key={template.key}
              onClick={() => bulkUpdate?.(template.srcDoc)}
            >
              {template.key}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    </div>
  );
}
