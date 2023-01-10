import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPaneCount } from "selectors/multiPaneSelectors";
import { setPaneCount } from "actions/multiPaneActions";
import MultiPaneSwitch2 from "assets/icons/header/multi-pane-switch-2.svg";
import MultiPaneSwitch3 from "assets/icons/header/multi-pane-switch-3.svg";
import { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";

const PaneCountSwitcher = () => {
  const dispatch = useDispatch();
  const paneCount = useSelector(getPaneCount);

  const updateCount = useCallback((count: PaneLayoutOptions) => {
    dispatch(setPaneCount(count));
  }, []);

  return (
    <div
      className="px-2 cursor-pointer"
      onClick={() =>
        updateCount(
          paneCount === PaneLayoutOptions.TWO_PANE
            ? PaneLayoutOptions.THREE_PANE
            : PaneLayoutOptions.TWO_PANE,
        )
      }
    >
      {paneCount === PaneLayoutOptions.TWO_PANE ? (
        <img alt={"Show 2 panes"} src={MultiPaneSwitch2} />
      ) : (
        <img alt={"Show 3 panes"} src={MultiPaneSwitch3} />
      )}
    </div>
  );
};

export default PaneCountSwitcher;
