import React from "react";
import { Classes as BPClasses } from "@blueprintjs/core";
import type { Dispatch } from "redux";
import { useDispatch } from "react-redux";
import type { Message, SourceEntity } from "entities/AppsmithConsole";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  createMessage,
  DEBUGGER_APPSMITH_SUPPORT,
  DEBUGGER_INTERCOM_TEXT,
  DEBUGGER_OPEN_DOCUMENTATION,
  DEBUGGER_SEARCH_SNIPPET,
  TROUBLESHOOT_ISSUE,
} from "@appsmith/constants/messages";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
} from "design-system";
import { executeCommandAction } from "actions/apiPaneActions";
import { SlashCommand } from "entities/Action";
import type { FieldEntityInformation } from "../CodeEditor/EditorConfig";
const { intercomAppID } = getAppsmithConfigs();

enum CONTEXT_MENU_ACTIONS {
  DOCS = "DOCS",
  SNIPPET = "SNIPPET",
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
    CONTEXT_MENU_ACTIONS.SNIPPET,
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
        return [
          CONTEXT_MENU_ACTIONS.DOCS,
          CONTEXT_MENU_ACTIONS.SNIPPET,
          CONTEXT_MENU_ACTIONS.INTERCOM,
        ];
      case PropertyEvaluationErrorType.PARSE:
        return [CONTEXT_MENU_ACTIONS.DOCS, CONTEXT_MENU_ACTIONS.SNIPPET];
      case PropertyEvaluationErrorType.LINT:
        return [CONTEXT_MENU_ACTIONS.SNIPPET];
      default:
        return defaultOptions;
    }
  }
};

const isFieldEntityInformation = (
  entity: FieldEntityInformation | SourceEntity,
): entity is FieldEntityInformation => {
  return entity.hasOwnProperty("entityType");
};

const getSnippetArgs = function (
  entity?: FieldEntityInformation | SourceEntity,
) {
  if (!entity) return {};
  if (isFieldEntityInformation(entity)) {
    return {
      entityId: entity.entityId,
      entityType: entity.entityType,
    };
  } else {
    return {
      entityId: entity.id,
      entityType: entity.type,
    };
  }
};

type ContextualMenuProps = {
  error: Message;
  children: JSX.Element;
  entity?: FieldEntityInformation | SourceEntity;
  enableTooltip?: boolean;
};

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
      window.open(
        "https://docs.appsmith.com/help-and-support/troubleshooting-guide",
        "_blank",
      );
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
  [CONTEXT_MENU_ACTIONS.SNIPPET]: {
    icon: "snippet",
    text: createMessage(DEBUGGER_SEARCH_SNIPPET),
    onSelect: (error: Message, dispatch: Dispatch, entity) => {
      AnalyticsUtil.logEvent("DEBUGGER_CONTEXT_MENU_CLICK", {
        menuItem: CONTEXT_MENU_ACTIONS.SNIPPET,
      });
      /// Search through the omnibar
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "DEBUGGER",
        searchTerm: error.message,
        errorType: error.type,
      });
      dispatch(setGlobalSearchQuery(""));
      dispatch(
        executeCommandAction({
          actionType: SlashCommand.NEW_SNIPPET,
          args: getSnippetArgs(entity),
        }),
      );
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
