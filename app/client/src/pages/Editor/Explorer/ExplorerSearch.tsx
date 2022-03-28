import classNames from "classnames";
import { isFunction } from "lodash";
import React, { forwardRef, Ref, useState, useCallback } from "react";

import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";
import { ReactComponent as CrossIcon } from "assets/icons/ads/cross.svg";
import { ReactComponent as SearchIcon } from "assets/icons/ads/search.svg";

/*eslint-disable react/display-name */
export const ExplorerSearch = forwardRef(
  (
    props: {
      clear: () => void;
      placeholder?: string;
      autoFocus?: boolean;
      isHidden?: boolean;
      onChange?: (e: any) => void;
    },
    ref: Ref<HTMLInputElement>,
  ) => {
    const [value, setValue] = useState("");
    const [focussed, setFocussed] = useState(false);

    /**
     * on change of input
     */
    const onChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
      e.persist();

      setValue(e.currentTarget.value);

      if (isFunction(props.onChange)) {
        props.onChange(e);
      }
    }, []);

    /**
     * on click of cross button
     */
    const onClear = useCallback(() => {
      setValue("");

      if (isFunction(props.onChange)) {
        props.clear();
      }
    }, []);

    return (
      <div
        className={classNames({
          "sticky top-0 bg-gray-50": true,
          hidden: props.isHidden,
        })}
      >
        <div
          className={classNames({
            "flex px-3 items-center space-x-2": true,
          })}
        >
          <SearchIcon className="box-content w-3 h-3 p-1" />
          <input
            autoComplete="off"
            autoFocus
            className="flex-grow py-2 text-gray-800 bg-transparent placeholder-trueGray-500"
            id={ENTITY_EXPLORER_SEARCH_ID}
            onBlur={() => setFocussed(false)}
            onChange={onChange}
            onFocus={() => setFocussed(true)}
            placeholder="Search Widgets"
            ref={ref}
            type="text"
          />
          {value && (
            <button className="p-1 hover:bg-trueGray-200" onClick={onClear}>
              <CrossIcon className="w-3 h-3 text-trueGray-100" />
            </button>
          )}
        </div>
        <div
          className={classNames({
            "border-b border-primary-500 transition-all duration-400 absolute bottom-0": true,
            "w-0": !focussed,
            "w-full": focussed,
          })}
        />
      </div>
    );
  },
);

export default ExplorerSearch;
