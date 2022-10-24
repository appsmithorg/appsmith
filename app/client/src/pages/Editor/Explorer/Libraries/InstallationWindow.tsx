import { Popover2 } from "@blueprintjs/popover2";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  Button,
  Category,
  Icon,
  IconSize,
  Size,
  Spinner,
  Text,
  TextInput,
  TextType,
  TooltipComponent as Tooltip,
} from "design-system";
import { EntityClassNames } from "../Entity";
import {
  ADD_PAGE_TOOLTIP,
  createMessage,
  customJSLibraryMessages,
} from "ce/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Position } from "@blueprintjs/core";
import EntityAddButton from "../Entity/AddButton";
import ProfileImage from "pages/common/ProfileImage";
import { Colors } from "constants/Colors";
import { isValidURL } from "utils/URLUtils";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { AppState } from "ce/reducers";
import { createSelector } from "reselect";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { InstallState } from "reducers/uiReducers/libraryReducer";

type TInstallWindowProps = any;

const Wrapper = styled.div`
  display: flex;
  height: 500px;
  width: 400px;
  flex-direction: column;
  .installation-header {
    padding: 24px 24px 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .search-area {
    padding: 0 24px;
    .left-icon {
      margin-left: 14px;
      .cs-icon {
        margin-right: 0;
      }
    }
    display: flex;
    flex-direction: column;
    .search-bar {
      margin-bottom: 8px;
    }
    .search-CTA {
      display: flex;
      flex-direction: column;
      margin-top: 16px;
    }
  }
  .search-results {
    height: 300px;
    overflow: auto;
    .library-card {
      padding: 12px 24px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      gap: 8px;
      border-bottom: 1px solid var(--appsmith-color-black-100);
      &:hover {
        background-color: var(--appsmith-color-black-100);
      }
    }
  }
`;

function installLibraryInit(payload: string) {
  return {
    type: ReduxActionTypes.INSTALL_LIBRARY_INIT,
    payload,
  };
}

export default function InstallationWindow(props: TInstallWindowProps) {
  const { className, open } = props;
  const [show, setShow] = useState(open);

  useEffect(() => {
    setShow(open);
  }, [open]);

  const closeWindow = useCallback(() => {
    setShow(false);
  }, []);

  return (
    <Popover2
      className="h-9"
      content={<InstallationPopoverContent closeWindow={closeWindow} />}
      isOpen={show}
      minimal
      onClose={() => {
        setShow(false);
      }}
      placement="right-start"
      transitionDuration={0}
    >
      <Tooltip
        boundary="viewport"
        className={EntityClassNames.TOOLTIP}
        content={createMessage(ADD_PAGE_TOOLTIP)}
        disabled={show}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position={Position.RIGHT}
      >
        <EntityAddButton
          className={`${className} ${show ? "selected" : ""}`}
          onClick={() => setShow(true)}
        />
      </Tooltip>
    </Popover2>
  );
}

const InstallationProgressWrapper = styled.div`
  display: flex;
  margin-top: 0.75rem;
  flex-direction: column;
  background: var(--appsmith-color-black-100);
  text-overflow: ellipsis;
  .progress-container {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 1.5rem 0.75rem;
    gap: 0.5rem;
    background: var(--appsmith-color-black-50);
    span {
      font-size: 12px;
      font-weight: normal;
    }
    .progress-bar {
      height: 6px;
      width: 100%;
      background: #d3d3d3;
      .completed {
        height: 6px;
        background: #03b365;
        width: 60%;
      }
    }
  }
`;

const selectCurrentInstallation = createSelector(
  (state: AppState) => state.ui.libraries.installationStatus,
  (queue: any) => {
    return Object.keys(queue).filter(
      (lib) => queue[lib] === InstallState.Installing,
    )[0];
  },
);

function InstallationProgress() {
  const url = useSelector(selectCurrentInstallation);
  const application = useSelector(getCurrentApplication);
  if (!url) return null;
  return (
    <InstallationProgressWrapper>
      <div className="pl-6 pr-6 pt-3 pb-3 bg-g overflow-hidden text-ellipsis fw-500 text-sm">
        {url}
      </div>
      <div className="progress-container">
        <div className="flex flex-row gap-2 items-center">
          <Spinner />
          <span>Installing library for {application?.name}</span>
        </div>
        <div className="progress-bar">
          <div className="completed" />
        </div>
      </div>
    </InstallationProgressWrapper>
  );
}

function InstallationPopoverContent(props: any) {
  const { closeWindow } = props;
  const [URL, setURL] = useState("");
  const [isValid, setIsValid] = useState(true);
  const dispatch = useDispatch();

  const updateURL = useCallback((value: string) => {
    setURL(value);
  }, []);

  const validate = useCallback((text) => {
    const isValid = !text || isValidURL(text);
    setIsValid(isValid);
    return {
      isValid,
      message: isValid ? "" : "Please enter a valid URL",
    };
  }, []);

  const installLibrary = useCallback(
    (index?: number) => {
      if (!index) {
        dispatch(installLibraryInit(URL));
      }
    },
    [URL],
  );

  return (
    <Wrapper>
      <div className="installation-header">
        <Text type={TextType.H2} weight={"bold"}>
          {createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
        </Text>
        <Icon
          fillColor={Colors.GRAY}
          name="close-modal"
          onClick={closeWindow}
          size={IconSize.XXL}
        />
      </div>
      <div className="search-area">
        <div className="flex flex-row gap-2 justify-between items-center">
          <TextInput
            $padding="12px"
            data-testid="library-url"
            leftIcon="link-2"
            onChange={updateURL}
            padding="12px"
            placeholder="Enter a URL"
            validator={validate}
            width="100%"
          />
          {URL && isValid && (
            <Button
              category={Category.tertiary}
              data-testid="install-library-btn"
              icon="download"
              onClick={() => installLibrary()}
              size={Size.small}
              tag="button"
              text="INSTALL"
              type="button"
            />
          )}
        </div>
        <div className="search-CTA">
          <Text type={TextType.P3}>
            Explore libraries on{" "}
            <Text color="var(--appsmith-color-orange-500)" type={TextType.P3}>
              CDNJS
            </Text>{" "}
            or NPM.
          </Text>
          <Text type={TextType.P3}>
            Learn more about Custom JS Libraries here.
          </Text>
        </div>
      </div>
      <InstallationProgress />
      <div className="ml-6 mb-3 mt-4">
        <Text type={TextType.P1} weight={"bold"}>
          {createMessage(customJSLibraryMessages.REC_LIBRARY)}
        </Text>
      </div>
      <div className="search-results">
        {new Array(20).fill(0).map((_, idx) => (
          <div className="library-card" key={idx}>
            <div className="flex flex-row justify-between">
              <div className="flex flex-row gap-2">
                <Text type={TextType.P0} weight="bold">
                  angular-aria
                </Text>
                <Icon
                  fillColor={Colors.GRAY}
                  name="open-new-tab"
                  size={IconSize.MEDIUM}
                />
              </div>
              <Icon
                fillColor={Colors.GRAY}
                name="download"
                size={IconSize.MEDIUM}
              />
            </div>
            <div className="flex flex-row">
              <Text type={TextType.P2}>
                AngularJS module for common ARIA attributes that convey state or
                semantic information about the application for users of
                assistive technologies.
              </Text>
            </div>
            <div className="flex flex-row items-center gap-1">
              <ProfileImage size={20} />
              <Text type={TextType.P3}>Arun</Text>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
