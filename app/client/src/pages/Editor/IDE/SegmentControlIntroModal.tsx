import React, { useState } from "react";
import { AnnouncementModal, Button, Tag } from "design-system";
import localStorage, { LOCAL_STORAGE_KEYS } from "utils/localStorage";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { queryListURL } from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import history from "utils/history";

const SegmentControlIntroModal = () => {
  const basePageId = useSelector(getCurrentBasePageId);
  const localStorageFlag =
    localStorage.getItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL) || "0";
  const [show, setShow] = useState(JSON.parse(localStorageFlag) === 0);

  const tryClickHandler = () => {
    setShow(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SEGMENT_INTRO_MODAL, "1");
    history.push(queryListURL({ basePageId }), {});
  };

  const modalFooter = () => (
    <Button
      data-testid="t--ide-close-announcement"
      kind="primary"
      onClick={tryClickHandler}
      size="md"
    >
      Take a quick tour
    </Button>
  );

  const modalDescription = () => (
    <div>
      Build your application with data Queries, Javascript Objects, 50+ UI
      Elements to build your UI with and{" "}
      <Tag className="!inline-flex" isClosable={false} kind="premium">
        {"{{bindings}}"}
      </Tag>{" "}
      to connect them all
    </div>
  );

  return (
    <AnnouncementModal
      banner={getAssetUrl(`${ASSETS_CDN_URL}/splitpane-banner.svg`)}
      description={modalDescription()}
      footer={modalFooter()}
      isOpen={show}
      title={"Welcome to your application’s Editor"}
    />
  );
};

export { SegmentControlIntroModal };
