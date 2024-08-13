import React, { Suspense, lazy } from "react";
import styled from "styled-components";
import { snipingModeSelector } from "selectors/editorSelectors";
import { retryPromise } from "utils/AppsmithUtils";
import { useSelector } from "react-redux";
import { IDE_HEADER_HEIGHT } from "IDE";

const BindingBanner = styled.div`
  position: fixed;
  width: 199px;
  height: 36px;
  left: 50%;
  top: ${IDE_HEADER_HEIGHT}px;
  transform: translate(-50%, 0);
  text-align: center;
  background: var(--ads-v2-color-fg-information);
  color: var(--ads-v2-color-white);
  border-radius: var(--ads-v2-border-radius);
  font-weight: 500;
  font-size: 15px;
  line-height: 20px;
  /* Depth: 01 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ads-v2-shadow-popovers);
  z-index: 9999;
`;

const GlobalSearch = lazy(async () => {
  return retryPromise(
    async () =>
      import(
        /* webpackChunkName: "global-search" */ "components/editorComponents/GlobalSearch"
      ),
  );
});

export const Omnibar = () => {
  const isSnipingMode = useSelector(snipingModeSelector);
  return (
    <>
      <Suspense fallback={<span />}>
        <GlobalSearch />
      </Suspense>
      {isSnipingMode && (
        <BindingBanner className="t--sniping-mode-banner">
          Select a widget to bind
        </BindingBanner>
      )}
    </>
  );
};
