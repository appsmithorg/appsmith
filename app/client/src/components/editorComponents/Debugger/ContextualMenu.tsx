import React from "react";
import { Classes as BPClasses } from "@blueprintjs/core";
import type { Dispatch } from "redux";
import { useDispatch, useSelector } from "react-redux";
import type { Message, SourceEntity } from "entities/AppsmithConsole";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { isPylonChatAvailable } from "utils/bootPylon";
import { getAppsmithConfigs } from "ee/configs";
import { getCurrentUser } from "selectors/usersSelectors";
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

const { cloudHosting } = getAppsmithConfigs();

enum CONTEXT_MENU_ACTIONS {
  DOCS = "DOCS",
  CHAT_WIDGET = "CHAT_WIDGET",
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
    CONTEXT_MENU_ACTIONS.CHAT_WIDGET,
  ];

  if (subType) {
    switch (subType) {
      // These types are sent by the server
      case PLUGIN_EXECUTION_ERRORS.DATASOURCE_CONFIGURATION_ERROR:
        return [CONTEXT_MENU_ACTIONS.CHAT_WIDGET];
      case PLUGIN_EXECUTION_ERRORS.PLUGIN_ERROR:
        return [CONTEXT_MENU_ACTIONS.CHAT_WIDGET];
      case PLUGIN_EXECUTION_ERRORS.CONNECTIVITY_ERROR:
        return [CONTEXT_MENU_ACTIONS.DOCS];
      case PLUGIN_EXECUTION_ERRORS.ACTION_CONFIGURATION_ERROR:
        return [CONTEXT_MENU_ACTIONS.DOCS, CONTEXT_MENU_ACTIONS.CHAT_WIDGET];
      default:
        return defaultOptions;
    }
  } else {
    switch (type) {
      case PropertyEvaluationErrorType.VALIDATION:
        return [CONTEXT_MENU_ACTIONS.DOCS, CONTEXT_MENU_ACTIONS.CHAT_WIDGET];
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
  [CONTEXT_MENU_ACTIONS.CHAT_WIDGET]: {
    icon: "support",
    text: createMessage(DEBUGGER_APPSMITH_SUPPORT),
    onSelect: (error: Message) => {
      AnalyticsUtil.logEvent("DEBUGGER_CONTEXT_MENU_CLICK", {
        menuItem: CONTEXT_MENU_ACTIONS.CHAT_WIDGET,
      });

      // Search through the omnibar
      if (isPylonChatAvailable()) {
        window.Pylon(
          "showNewMessage",
          createMessage(DEBUGGER_INTERCOM_TEXT, error.message.message),
        );
        window.Pylon("show");
      }
    },
  },
};

const ContextualMenu = ({
  enableTooltip = true,
  ...props
}: ContextualMenuProps) => {
  const dispatch = useDispatch();
  const user = useSelector(getCurrentUser);
  const isPylonConsentSatisfied =
    cloudHosting || Boolean(user?.isIntercomConsentGiven);
  const visibleOptions = getOptions(
    props.error.type,
    props.error.subType,
  ).filter(
    (e) =>
      e !== CONTEXT_MENU_ACTIONS.CHAT_WIDGET ||
      (isPylonChatAvailable() && isPylonConsentSatisfied),
  );

  if (!visibleOptions.length) {
    return props.children;
  }

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
        {visibleOptions.map((e) => {
          const menuProps = searchAction[e];
          const onSelect = () => {
            menuProps.onSelect(props.error, dispatch, props.entity);
          };

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
