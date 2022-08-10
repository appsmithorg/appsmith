import { FocusEntity } from "navigation/FocusableEntity";
import { useParams, useRouteMatch } from "react-router";
import { AppState } from "reducers";
import { useDispatch, useSelector } from "react-redux";
import { setFocusHistory } from "actions/focusHistoryActions";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { useEffect } from "react";

export type FocusInformation = {
  entity: FocusEntity;
  name: string;
  parent: string;
};

export interface FocusableElement {
  childFocusElements: FocusableElement[];
  getElementInformation: () => FocusInformation;
  focus: () => void;
  storeLastState: () => void;
}

export type cursorState = {
  ln: number;
  ch: number;
};

export type evaluatedPaneState = {
  structure: boolean;
  example: boolean;
  value: boolean;
};

export interface FocusableInput extends FocusableElement {
  storeCursorState: (
    cursorState: cursorState,
    evaluatedState: evaluatedPaneState,
  ) => void;
}

type matchParams = {
  pageId?: string;
  applicationId?: string;
  apiId?: string;
  queryId?: string;
  collectionId?: string;
};

const getKeyFromRoute = (
  matchParams: matchParams,
  elementName: string,
): { entity: FocusEntity; key: string; entityId: string } => {
  let key = "";
  if (matchParams.apiId) {
    key = key + `.${FocusEntity.ApiPane}.${matchParams.apiId}`;
    return {
      key: key + `.${elementName}`,
      entityId: matchParams.apiId,
      entity: FocusEntity.ApiPane,
    };
  }
  return { key, entityId: "", entity: FocusEntity.Widget };
};

const getFocusStates = (state: AppState) => state.ui.focusHistory.focusInfo;

export function useFocusable(elementName: string): [boolean, () => void] {
  const params = useParams();
  const { entity, entityId, key } = getKeyFromRoute(params, elementName);
  const focusStates = useSelector(getFocusStates, () => true);
  const isFocused = key in focusStates;
  const dispatch = useDispatch();

  const setFocus = function(
    childElementName?: string,
    moreInfo: FocusState["moreInfo"] = {},
  ) {
    dispatch(
      setFocusHistory(key, {
        entity,
        entityId,
        elementName: childElementName || elementName,
        moreInfo,
      }),
    );
  };

  return [isFocused, setFocus];
}

export interface FocusableInput extends FocusableElement {
  storeCursorState: (
    cursorState: cursorState,
    evaluatedState: evaluatedPaneState,
  ) => void;
}
