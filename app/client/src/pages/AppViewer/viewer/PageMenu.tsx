import React, { useState, useEffect } from "react";
import {
  CurrentApplicationData,
  PageListPayload,
} from "constants/ReduxActionConstants";
import { NavLink, useLocation } from "react-router-dom";
import { getPageURL } from "utils/AppsmithUtils";
import { getAppMode } from "selectors/applicationSelectors";
import { useSelector } from "react-redux";
import classNames from "classnames";

type AppViewerHeaderProps = {
  isOpen?: boolean;
  application?: CurrentApplicationData;
  pages: PageListPayload;
};

export function PageMenu(props: AppViewerHeaderProps) {
  const { application, isOpen, pages } = props;
  const appMode = useSelector(getAppMode);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(window.location.search);
  }, [location]);

  // Mark default page as first page
  const appPages = pages;
  if (appPages.length > 1) {
    appPages.forEach((item, i) => {
      if (item.isDefault) {
        appPages.splice(i, 1);
        appPages.unshift(item);
      }
    });
  }

  return appPages.length > 1 ? (
    <div
      className={classNames({
        "absolute w-full py-3 bg-white": true,
        hidden: !isOpen,
      })}
    >
      <div className="">
        {appPages.map((page) => (
          <NavLink
            activeClassName="border-l-2 border-primary-500 font-semibold"
            className="flex flex-col px-4 py-2 text-gray-700 no-underline border-l-2 border-transparent hover:no-underline focus:text-gray-700"
            key={page.pageId}
            to={{
              pathname: getPageURL(page, appMode, application),
              search: query,
            }}
          >
            {page.pageName}
          </NavLink>
        ))}
      </div>
    </div>
  ) : null;
}

export default PageMenu;
