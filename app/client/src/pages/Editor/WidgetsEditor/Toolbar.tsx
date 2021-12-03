import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import MenuIcon from "remixicon-react/MenuLineIcon";
import { setExplorerActiveAction } from "actions/explorerActions";
import { getExplorerPinned } from "selectors/explorerSelector";

function Toolbar() {
  const dispatch = useDispatch();
  const explorerPinned = useSelector(getExplorerPinned);

  /**
   * on hovering the menu, make the explorer active
   */
  const onMenuHover = useCallback(() => {
    dispatch(setExplorerActiveAction(true));
  }, [setExplorerActiveAction]);

  return (
    <div className="border-b flex items-center justify-between px-3 py-2 z-1">
      <div>
        {explorerPinned === false && (
          <MenuIcon
            className="w-5 h-5 text-trueGray-400 cursor-pointer"
            onMouseEnter={onMenuHover}
          />
        )}
      </div>
    </div>
  );
}

export default Toolbar;
