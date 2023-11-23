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
          <Button isIconButton kind="tertiary" size="md" startIcon="wand" />
        </MenuTrigger>
        <MenuContent>
          {initialSrcDoc && lastSaved && (
            <>
              <MenuItem onClick={() => bulkUpdate?.(initialSrcDoc)}>
                Reset to initial version
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
