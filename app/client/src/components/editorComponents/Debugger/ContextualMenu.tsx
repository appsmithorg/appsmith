import React from "react";
import copy from "copy-to-clipboard";
import Menu from "components/ads/Menu";
import MenuItem from "components/ads/MenuItem";
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
import { createMessage, DEBUGGER_INTERCOM_TEXT } from "constants/messages";
import { useDispatch } from "react-redux";
import { Classes, Position } from "@blueprintjs/core";
const { intercomAppID } = getAppsmithConfigs();

const getOptions = (type?: string, subType?: string) => {
  const defaultOptions = ["copy", "docs", "intercom", "google"];

  if (subType) {
    switch (subType) {
      case "DATASOURCE_CONFIG_ERROR":
        return ["copy", "google", "intercom"];
      case "PLUGIN_ERROR":
        return ["copy", "google", "intercom"];
      case "CONNECTIVITY_ERROR":
        return ["copy", "docs"];
      case "ACTION_CONFIG_ERROR":
        return ["copy", "docs", "intercom"];
      default:
        return defaultOptions;
    }
  } else {
    switch (type) {
      case PropertyEvaluationErrorType.VALIDATION:
        return ["copy", "docs", "intercom"];
      case PropertyEvaluationErrorType.PARSE:
        return ["copy", "google"];
      case PropertyEvaluationErrorType.LINT:
        return ["copy", "google"];
      default:
        return defaultOptions;
    }
  }
};

type ContextualMenuProps = {
  error: Message;
  children: JSX.Element;
};

const searchAction: Record<string, any> = {
  copy: {
    icon: "duplicate",
    text: "Copy",
    onSelect: (error: Message) => {
      copy(error.message);
    },
  },
  google: {
    icon: "share",
    text: "Ask Google",
    onSelect: (error: Message) => {
      window.open("http://google.com/search?q=" + error.message);
    },
  },
  docs: {
    icon: "book-line",
    text: "Open Documentation",
    onSelect: (error: Message, dispatch: Dispatch) => {
      // Search through the omnibar
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "DEBUGGER",
        searchTerm: error.message,
        errorType: PropertyEvaluationErrorType.VALIDATION,
      });
      dispatch(setGlobalSearchQuery(error.message || ""));
      dispatch(
        toggleShowGlobalSearchModal(filterCategories[SEARCH_CATEGORY_ID.INIT]),
      );
    },
  },
  intercom: {
    icon: "chat",
    text: "Get Appsmith Support",
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
};

export default function ContextualMenu(props: ContextualMenuProps) {
  const options = getOptions(props.error.type, props.error.subType);
  const dispatch = useDispatch();

  return (
    <Menu
      modifiers={{
        offset: {
          offset: "25px, 5px",
        },
      }}
      position={Position.RIGHT}
      target={props.children}
    >
      {options.map((e) => {
        const menuProps = searchAction[e];
        const onSelect = () => {
          menuProps.onSelect(props.error, dispatch);
        };

        return (
          <MenuItem
            className={Classes.POPOVER_DISMISS}
            icon={menuProps.icon}
            key={e}
            onSelect={onSelect}
            text={menuProps.text}
          />
        );
      })}
    </Menu>
  );
}
