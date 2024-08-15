import React from "react";
import { Classes as BPClasses } from "@blueprintjs/core";
import type { Dispatch } from "redux";
import { useDispatch } from "react-redux";
import type { Message, SourceEntity } from "entities/AppsmithConsole";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAppsmithConfigs } from "ee/configs";
import {
  createMessage,
  DEBUGGER_APPSMITH_SUPPORT,
  DEBUGGER_INTERCOM_TEXT,
  DEBUGGER_OPEN_DOCUMENTATION,
  TROUBLESHOOT_ISSUE,
} from "ee/constants/messages";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
} from "@appsmith/ads";
import type { FieldEntityInformation } from "../CodeEditor/EditorConfig";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";

const { intercomAppID } = getAppsmithConfigs();

enum CONTEXT_MENU_ACTIONS {
  DOCS = "DOCS",
  INTERCOM = "INTERCOM",
}

enum PLUGIN_EXECUTION_ERRORS {
  DATASOURCE_CONFIGURATION_ERROR = "DATASOURCE_CONFIGURATION_ERROR",
  PLUGIN_ERROR = "PLUGIN_ERROR",
  CONNECTIVITY_ERROR = "CONNECTIVITY_ERROR",
  ACTION_CONFIGURATION_ERROR = "ACTION_CONFIGURATION_ERROR",
}

const getOptions = (type?: string, subType?: string) => {
  const defaultOptions = [
    CONTEXT_MENU_ACTIONS.DOCS,
    CONTEXT_MENU_ACTIONS.INTERCOM,
  ];

  if (subType) {
    switch (subType) {
      // These types are sent by the server
      case PLUGIN_EXECUTION_ERRORS.DATASOURCE_CONFIGURATION_ERROR:
        return [CONTEXT_MENU_ACTIONS.INTERCOM];
      case PLUGIN_EXECUTION_ERRORS.PLUGIN_ERROR:
        return [CONTEXT_MENU_ACTIONS.INTERCOM];
      case PLUGIN_EXECUTION_ERRORS.CONNECTIVITY_ERROR:
        return [CONTEXT_MENU_ACTIONS.DOCS];
      case PLUGIN_EXECUTION_ERRORS.ACTION_CONFIGURATION_ERROR:
        return [CONTEXT_MENU_ACTIONS.DOCS, CONTEXT_MENU_ACTIONS.INTERCOM];
      default:
        return defaultOptions;
    }
  } else {
    switch (type) {
      case PropertyEvaluationErrorType.VALIDATION:
        return [CONTEXT_MENU_ACTIONS.DOCS, CONTEXT_MENU_ACTIONS.INTERCOM];
      case PropertyEvaluationErrorType.PARSE:
        return [CONTEXT_MENU_ACTIONS.DOCS];
      default:
        return defaultOptions;
    }
  }
};

interface ContextualMenuProps {
  error: Message;
  children: JSX.Element;
  entity?: FieldEntityInformation | SourceEntity;
  enableTooltip?: boolean;
}

const searchAction: Record<
  CONTEXT_MENU_ACTIONS,
  {
    icon: string;
    text: string;
    onSelect: (
      error: Message,
      dispatch: Dispatch,
      entity?: FieldEntityInformation | SourceEntity,
    ) => void;
  }
> = {
  [CONTEXT_MENU_ACTIONS.DOCS]: {
    icon: "book-line",
    text: createMessage(DEBUGGER_OPEN_DOCUMENTATION),
    onSelect: () => {
      AnalyticsUtil.logEvent("DEBUGGER_CONTEXT_MENU_CLICK", {
        menuItem: CONTEXT_MENU_ACTIONS.DOCS,
      });
      openDoc(DocsLink.TROUBLESHOOT_ERROR);
    },
  },
  [CONTEXT_MENU_ACTIONS.INTERCOM]: {
    icon: "support",
    text: createMessage(DEBUGGER_APPSMITH_SUPPORT),
    onSelect: (error: Message) => {
      AnalyticsUtil.logEvent("DEBUGGER_CONTEXT_MENU_CLICK", {
        menuItem: CONTEXT_MENU_ACTIONS.INTERCOM,
      });
      // Search through the omnibar
      if (intercomAppID && window.Intercom) {
        window.Intercom(
          "showNewMessage",
          createMessage(DEBUGGER_INTERCOM_TEXT, error.message.message),
        );
      }
    },
  },
};

const ContextualMenu = ({
  enableTooltip = true,
  ...props
}: ContextualMenuProps) => {
  const options = getOptions(props.error.type, props.error.subType);
  const dispatch = useDispatch();

  return (
    <Menu className="t--debugger-contextual-error-menu">
      <Tooltip
        content={createMessage(TROUBLESHOOT_ISSUE)}
        isDisabled={!enableTooltip}
        placement="bottom"
      >
        <MenuTrigger>{props.children}</MenuTrigger>
      </Tooltip>

      <MenuContent align="end">
        {options.map((e) => {
          const menuProps = searchAction[e];
          const onSelect = () => {
            menuProps.onSelect(props.error, dispatch, props.entity);
          };

          if (
            e === CONTEXT_MENU_ACTIONS.INTERCOM &&
            !(intercomAppID && window.Intercom)
          ) {
            return null;
          }

          return (
            <MenuItem
              className={`${BPClasses.POPOVER_DISMISS} t--debugger-contextual-menuitem`}
              key={e}
              onClick={onSelect}
              startIcon={menuProps.icon}
            >
              {menuProps.text}
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
};

export default ContextualMenu;
