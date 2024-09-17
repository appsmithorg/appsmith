import React, { useState } from "react";
import { AnnouncementModal, Button } from "@appsmith/ads";
import localStorage, { LOCAL_STORAGE_KEYS } from "utils/localStorage";
import { SPLITPANE_ANNOUNCEMENT, createMessage } from "ee/constants/messages";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

const Announcement = () => {
  const localStorageFlag =
    localStorage.getItem(LOCAL_STORAGE_KEYS.SPLITPANE_ANNOUNCEMENT) || "true";
  const [show, setShow] = useState(JSON.parse(localStorageFlag));

  const tryClickHandler = () => {
    setShow(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SPLITPANE_ANNOUNCEMENT, "false");
  };

  const learnClickHandler = () => {
    window.open(
      "https://community.appsmith.com/content/blog/discover-ide-20-building-more-efficient-ide",
      "_blank",
    );
  };

  const modalFooter = () => (
    <>
      <Button
        data-testid="t--ide-close-announcement"
        kind="primary"
        onClick={tryClickHandler}
        size="md"
      >
        Try it out
      </Button>
      <Button kind="tertiary" onClick={learnClickHandler} size="md">
        Learn more
      </Button>
    </>
  );

  return (
    <AnnouncementModal
      banner={getAssetUrl(`${ASSETS_CDN_URL}/splitpane-banner.svg`)}
      description={createMessage(SPLITPANE_ANNOUNCEMENT.DESCRIPTION)}
      footer={modalFooter()}
      isBeta
      isOpen={show}
      title={createMessage(SPLITPANE_ANNOUNCEMENT.TITLE)}
    />
  );
};

export { Announcement };
