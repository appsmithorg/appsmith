import classNames from "classnames";
import React, { forwardRef, Ref, useState } from "react";

import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";
import { ReactComponent as SearchIcon } from "assets/icons/ads/search.svg";
import { ReactComponent as CrossIcon } from "assets/icons/ads/cross.svg";

/*eslint-disable react/display-name */
export const ExplorerSearch = forwardRef(
  (
    props: {
      clear: () => void;
      placeholder?: string;
      autoFocus?: boolean;
      isHidden?: boolean;
    },
    ref: Ref<HTMLInputElement>,
  ) => {
    const [focussed, setFocussed] = useState(false);
    return (
      <div className="relative">
        <div
          className={classNames({
            "flex px-3 items-center space-x-2": true,
            hidden: props.isHidden,
          })}
        >
          <SearchIcon className="h-3 w-3 p-1 box-content" />
          <input
            autoComplete="off"
            autoFocus
            className="flex-grow bg-transparent py-2 placeholder-trueGray-500"
            id={ENTITY_EXPLORER_SEARCH_ID}
            onBlur={() => setFocussed(false)}
            onFocus={() => setFocussed(true)}
            placeholder="Search Widgets"
            ref={ref}
            type="text"
          />
          {focussed && (
            <button className="hover:bg-warmGray-700 p-1" onClick={props.clear}>
              <CrossIcon className="h-3 w-3 text-red" />
            </button>
          )}
        </div>
        <div
          className={classNames({
            "border-b border-primary-500 transition-all absolute bottom-0": true,
            "w-0": !focussed,
            "w-full": focussed,
          })}
        />
      </div>
    );
  },
);

export default ExplorerSearch;
