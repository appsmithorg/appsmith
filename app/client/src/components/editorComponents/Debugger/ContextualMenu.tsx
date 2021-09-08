import React from "react";
import copy from "copy-to-clipboard";
import Menu from "components/ads/Menu";
import styled from "styled-components";
import Text, { FontWeight, TextType } from "components/ads/Text";
import { Message } from "entities/AppsmithConsole";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { Dispatch } from "redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import { filterCategories, SEARCH_CATEGORY_ID } from "../GlobalSearch/utils";
import { getAppsmithConfigs } from "configs";
import {
  createMessage,
  DEBUGGER_APPSMITH_SUPPORT,
  DEBUGGER_COPY_MESSAGE,
  DEBUGGER_INTERCOM_TEXT,
  DEBUGGER_OPEN_DOCUMENTATION,
  DEBUGGER_SEARCH_GOOGLE,
  DEBUGGER_SEARCH_SNIPPET,
} from "constants/messages";
import { useDispatch } from "react-redux";
import {
  Classes as BPClasses,
  PopperModifiers,
  Position,
} from "@blueprintjs/core";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import { Colors } from "constants/Colors";
const { intercomAppID } = getAppsmithConfigs();

enum CONTEXT_MENU_ACTIONS {
  COPY = "COPU",
  DOCS = "DOCS",
  SNIPPET = "SNIPPET",
  GOOGLE = "GOOGLE",
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
    CONTEXT_MENU_ACTIONS.COPY,
    CONTEXT_MENU_ACTIONS.DOCS,
    CONTEXT_MENU_ACTIONS.SNIPPET,
    CONTEXT_MENU_ACTIONS.GOOGLE,
    CONTEXT_MENU_ACTIONS.INTERCOM,
  ];

  if (subType) {
    switch (subType) {
      // These types are sent by the server
      case PLUGIN_EXECUTION_ERRORS.DATASOURCE_CONFIGURATION_ERROR:
        return [
          CONTEXT_MENU_ACTIONS.COPY,
          CONTEXT_MENU_ACTIONS.GOOGLE,
          CONTEXT_MENU_ACTIONS.INTERCOM,
        ];
      case PLUGIN_EXECUTION_ERRORS.PLUGIN_ERROR:
        return [
          CONTEXT_MENU_ACTIONS.COPY,
          CONTEXT_MENU_ACTIONS.GOOGLE,
          CONTEXT_MENU_ACTIONS.INTERCOM,
        ];
      case PLUGIN_EXECUTION_ERRORS.CONNECTIVITY_ERROR:
        return [CONTEXT_MENU_ACTIONS.COPY, CONTEXT_MENU_ACTIONS.DOCS];
      case PLUGIN_EXECUTION_ERRORS.ACTION_CONFIGURATION_ERROR:
        return [
          CONTEXT_MENU_ACTIONS.COPY,
          CONTEXT_MENU_ACTIONS.DOCS,
          CONTEXT_MENU_ACTIONS.INTERCOM,
        ];
      default:
        return defaultOptions;
    }
  } else {
    switch (type) {
      case PropertyEvaluationErrorType.VALIDATION:
        return [
          CONTEXT_MENU_ACTIONS.COPY,
          CONTEXT_MENU_ACTIONS.DOCS,
          CONTEXT_MENU_ACTIONS.SNIPPET,
          CONTEXT_MENU_ACTIONS.INTERCOM,
        ];
      case PropertyEvaluationErrorType.PARSE:
        return [
          CONTEXT_MENU_ACTIONS.COPY,
          CONTEXT_MENU_ACTIONS.SNIPPET,
          CONTEXT_MENU_ACTIONS.GOOGLE,
        ];
      case PropertyEvaluationErrorType.LINT:
        return [
          CONTEXT_MENU_ACTIONS.COPY,
          CONTEXT_MENU_ACTIONS.SNIPPET,
          CONTEXT_MENU_ACTIONS.GOOGLE,
        ];
      default:
        return defaultOptions;
    }
  }
};

type ContextualMenuProps = {
  error: Message;
  children: JSX.Element;
  position?: Position;
  modifiers?: PopperModifiers;
};

const searchAction: Record<
  CONTEXT_MENU_ACTIONS,
  {
    icon: IconName;
    text: string;
    onSelect: (error: Message, dispatch: Dispatch) => void;
  }
> = {
  [CONTEXT_MENU_ACTIONS.COPY]: {
    icon: "duplicate",
    text: createMessage(DEBUGGER_COPY_MESSAGE),
    onSelect: (error: Message) => {
      copy(error.message);
    },
  },
  [CONTEXT_MENU_ACTIONS.GOOGLE]: {
    icon: "share-2",
    text: createMessage(DEBUGGER_SEARCH_GOOGLE),
    onSelect: (error: Message) => {
      window.open("http://google.com/search?q=" + error.message);
    },
  },
  [CONTEXT_MENU_ACTIONS.DOCS]: {
    icon: "book-line",
    text: createMessage(DEBUGGER_OPEN_DOCUMENTATION),
    onSelect: (error: Message, dispatch: Dispatch) => {
      // Search through the omnibar
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "DEBUGGER",
        searchTerm: error.message,
        errorType: error.type,
      });
      dispatch(setGlobalSearchQuery(error.message || ""));
      dispatch(
        toggleShowGlobalSearchModal(filterCategories[SEARCH_CATEGORY_ID.INIT]),
      );
    },
  },
  [CONTEXT_MENU_ACTIONS.INTERCOM]: {
    icon: "support",
    text: createMessage(DEBUGGER_APPSMITH_SUPPORT),
    onSelect: (error: Message) => {
      // Search through the omnibar
      if (intercomAppID && window.Intercom) {
        window.Intercom(
          "showNewMessage",
          createMessage(DEBUGGER_INTERCOM_TEXT, error.message),
        );
      }
    },
  },
  [CONTEXT_MENU_ACTIONS.SNIPPET]: {
    icon: "play",
    text: createMessage(DEBUGGER_SEARCH_SNIPPET),
    onSelect: (error: Message, dispatch: Dispatch) => {
      /// Search through the omnibar
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "DEBUGGER",
        searchTerm: error.message,
        errorType: error.type,
      });
      dispatch(setGlobalSearchQuery(""));
      dispatch(
        toggleShowGlobalSearchModal(
          filterCategories[SEARCH_CATEGORY_ID.SNIPPETS],
        ),
      );
    },
  },
};

const IconContainer = styled.span`
  display: flex;
  align-items: center;

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[4]}px;
  }
`;

const MenuItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 0px ${(props) => props.theme.spaces[6]}px;
  height: 28px;

  .${Classes.TEXT} {
    color: ${Colors.CODE_GRAY};
  }

  .${Classes.ICON} {
    path {
      fill: ${Colors.CODE_GRAY};
    }
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

export default function ContextualMenu(props: ContextualMenuProps) {
  const options = getOptions(props.error.type, props.error.subType);
  const dispatch = useDispatch();

  return (
    <Menu
      className="t--debugger-contextual-error-menu"
      menuItemWrapperWidth={"175px"}
      modifiers={
        props.modifiers || {
          offset: {
            offset: "25px, 5px",
          },
        }
      }
      position={props.position || Position.RIGHT}
      target={props.children}
    >
      {options.map((e) => {
        const menuProps = searchAction[e];
        const onSelect = () => {
          menuProps.onSelect(props.error, dispatch);
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
              <Icon name={menuProps.icon} size={IconSize.XS} />
              <Text type={TextType.P3} weight={FontWeight.NORMAL}>
                {menuProps.text}
              </Text>
            </IconContainer>
          </MenuItem>
        );
      })}
    </Menu>
  );
}
