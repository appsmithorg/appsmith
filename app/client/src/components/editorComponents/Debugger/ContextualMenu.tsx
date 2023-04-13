import React from "react";
import styled from "styled-components";
import { Classes as BPClasses, Position } from "@blueprintjs/core";
import type { IPopover2Props } from "@blueprintjs/popover2";
import { Popover2 } from "@blueprintjs/popover2";
import type { Dispatch } from "redux";
import { useDispatch } from "react-redux";
import { Classes, Text, FontWeight, TextType } from "design-system-old";
import type { Message, SourceEntity } from "entities/AppsmithConsole";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  setGlobalSearchQuery,
  setGlobalSearchCategory,
} from "actions/globalSearchActions";
import { filterCategories, SEARCH_CATEGORY_ID } from "../GlobalSearch/utils";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  createMessage,
  DEBUGGER_APPSMITH_SUPPORT,
  DEBUGGER_INTERCOM_TEXT,
  DEBUGGER_OPEN_DOCUMENTATION,
  DEBUGGER_SEARCH_SNIPPET,
} from "@appsmith/constants/messages";
import { Icon } from "design-system";
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
  position?: Position;
  modifiers?: IPopover2Props["modifiers"];
  entity?: FieldEntityInformation | SourceEntity;
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
    onSelect: (error: Message, dispatch: Dispatch) => {
      AnalyticsUtil.logEvent("DEBUGGER_CONTEXT_MENU_CLICK", {
        menuItem: CONTEXT_MENU_ACTIONS.DOCS,
      });
      // Search through the omnibar
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "DEBUGGER",
        searchTerm: error.message,
        errorType: error.type,
      });
      dispatch(setGlobalSearchQuery(error.message.message || ""));
      dispatch(
        setGlobalSearchCategory(filterCategories[SEARCH_CATEGORY_ID.INIT]),
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

const IconContainer = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MenuItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 8px ${(props) => props.theme.spaces[7]}px;
  height: 36px;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.menuItem.hoverText};
  }

  &:hover {
    text-decoration: none;
    cursor: pointer;
    background-color: ${(props) => props.theme.colors.menuItem.hoverBg};

    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.menuItem.hoverText};
    }
    .${Classes.ICON} {
      path {
        fill: ${(props) => props.theme.colors.menuItem.hoverIcon};
      }
    }
  }
`;

const MenuWrapper = styled.div<{ width: string }>`
  width: ${(props) => props.width};
  background: ${(props) => props.theme.colors.menu.background};
  box-shadow: ${(props) =>
    `${props.theme.spaces[0]}px ${props.theme.spaces[5]}px ${
      props.theme.spaces[12] - 2
    }px ${props.theme.colors.menu.shadow}`};
`;

export default function ContextualMenu(props: ContextualMenuProps) {
  const options = getOptions(props.error.type, props.error.subType);
  const dispatch = useDispatch();

  return (
    <Popover2
      className="t--debugger-contextual-error-menu"
      content={
        <MenuWrapper width={"200px"}>
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
              >
                <IconContainer>
                  <Icon color="#858282" name={menuProps.icon} size="md" />
                  <Text type={TextType.P3} weight={FontWeight.NORMAL}>
                    {menuProps.text}
                  </Text>
                </IconContainer>
              </MenuItem>
            );
          })}
        </MenuWrapper>
      }
      modifiers={
        props.modifiers || {
          offset: {
            enabled: true,
            options: {
              offset: [25, 5],
            },
          },
          arrow: {
            enabled: false,
          },
        }
      }
      position={props.position || Position.RIGHT}
    >
      {props.children}
    </Popover2>
  );
}
