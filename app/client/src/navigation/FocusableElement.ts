import { FocusEntity } from "navigation/FocusableEntity";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { useDispatch, useSelector } from "react-redux";
import { setFocusHistory } from "actions/focusHistoryActions";
import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";

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
  line: number;
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
  elementName?: string,
): { entity: FocusEntity; key: string; entityId: string } => {
  let key = "";
  if (matchParams.apiId) {
    key = key + `.${FocusEntity.ApiPane}.${matchParams.apiId}`;
    return {
      key: key + `${elementName ? `.${elementName}` : ""}`,
      entityId: matchParams.apiId,
      entity: FocusEntity.ApiPane,
    };
  }
  return { key, entityId: "", entity: FocusEntity.Widget };
};

//const getFocusStates = (state: AppState) => state.ui.focusHistory.focusInfo;

export type SetFocusMethod = (
  childElementName?: string,
  moreInfo?: FocusState["moreInfo"],
) => void;

export function useFocusable(
  elementName?: string,
): [FocusState, SetFocusMethod] {
  const params = useParams();
  const { entity, entityId, key } = getKeyFromRoute(params, elementName);
  const focusedState = useSelector(
    (state: AppState) => getCurrentFocusInfo(state, key),
    () => true,
  );
  const dispatch = useDispatch();

  const setFocus = function(
    childElementName?: string,
    moreInfo: FocusState["moreInfo"] = {},
  ) {
    if (childElementName) {
      dispatch(
        setFocusHistory(key, {
          entity,
          entityId,
          elementName: childElementName, // || elementName,
          moreInfo,
        }),
      );
    }
  };

  return [focusedState, setFocus];
}

export interface FocusableInput extends FocusableElement {
  storeCursorState: (
    cursorState: cursorState,
    evaluatedState: evaluatedPaneState,
  ) => void;
}
