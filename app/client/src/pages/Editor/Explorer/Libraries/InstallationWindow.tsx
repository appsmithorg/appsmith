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
  Toaster,
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
// import { getCurrentApplication } from "selectors/applicationSelectors";
import {
  selectInstallationStatus,
  selectInstalledLibraries,
} from "selectors/entitiesSelector";
import SaveSuccessIcon from "remixicon-react/CheckboxCircleFillIcon";
import SaveFailureIcon from "remixicon-react/ErrorWarningFillIcon";
import { InstallState } from "reducers/uiReducers/libraryReducer";
import { Variant } from "components/ads";

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
  }
  .search-body {
    display: flex;
    flex-direction: column;
    overflow: auto;
    height: 400px;
    .search-CTA {
      display: flex;
      flex-direction: column;
      margin-top: 16px;
      margin-left: 24px;
    }
    .search-results {
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
  const dispatch = useDispatch();

  useEffect(() => {
    setShow(open);
  }, [open]);

  const closeWindow = useCallback(() => {
    setShow(false);
    clearProcessedInstalls();
  }, []);

  const clearProcessedInstalls = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.CLEAR_PROCESSED_INSTALLS,
    });
  }, []);

  return (
    <Popover2
      className="h-9"
      content={<InstallationPopoverContent closeWindow={closeWindow} />}
      isOpen={show}
      minimal
      onClose={() => {
        clearProcessedInstalls();
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

const InstallationProgressWrapper = styled.div<{ addBorder: boolean }>`
  border-top: ${(props) =>
    props.addBorder ? `1px solid var(--appsmith-color-black-300)` : "none"};
  display: flex;
  flex-direction: column;
  background: var(--appsmith-color-black-100);
  text-overflow: ellipsis;
  padding: 8px 12px;
  margin: 0 24px;
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
  .install-url {
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
  }
`;

function getStatusIcon(status: InstallState) {
  if (status === InstallState.Success)
    return <SaveSuccessIcon color={Colors.GREEN} size={18} />;
  if (status === InstallState.Failed)
    return <SaveFailureIcon color={Colors.WARNING_SOLID} size={18} />;
  return <Spinner />;
}

function InstallationProgress() {
  const installStatusMap = useSelector(selectInstallationStatus);
  // const application = useSelector(getCurrentApplication);
  const urls = Object.keys(installStatusMap);
  if (urls.length === 0) return null;
  return (
    <>
      {urls.map((url, idx) => (
        <InstallationProgressWrapper
          addBorder={idx !== 0}
          key={`${url}_${idx}_${installStatusMap[url]}`}
        >
          {[InstallState.Queued, InstallState.Installing].includes(
            installStatusMap[url],
          ) && <div className="text-gray-700 text-xs">Installing...</div>}
          <div className="flex justify-between items-center bg-g gap-2 fw-500 text-sm">
            <div className="install-url fw-500">{url}</div>
            <div className="shrink-0">
              {getStatusIcon(installStatusMap[url])}
            </div>
          </div>
        </InstallationProgressWrapper>
      ))}
    </>
  );
}

function InstallationPopoverContent(props: any) {
  const { closeWindow } = props;
  const [URL, setURL] = useState("");
  const [isValid, setIsValid] = useState(true);
  const dispatch = useDispatch();
  const installedLibraries = useSelector(selectInstalledLibraries);

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
        const libFound = installedLibraries.find(
          (lib) => lib.displayName === URL,
        );
        if (libFound) {
          Toaster.show({
            text: createMessage(
              customJSLibraryMessages.INSTALLED_ALREADY,
              libFound.accessor,
            ),
            variant: Variant.info,
          });
          return;
        }
        dispatch(installLibraryInit(URL));
      }
    },
    [URL, installedLibraries],
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
            height="30px"
            leftIcon="link-2"
            onChange={updateURL}
            padding="12px"
            placeholder="Paste a library URL"
            validator={validate}
            width="100%"
          />
          {URL && isValid && (
            <Button
              category={Category.primary}
              data-testid="install-library-btn"
              icon="download"
              onClick={() => installLibrary()}
              size={Size.medium}
              tag="button"
              text="INSTALL"
              type="button"
            />
          )}
        </div>
      </div>
      <div className="search-body">
        <div className="search-CTA mb-3">
          <Text type={TextType.P3}>
            Explore libraries on{" "}
            <Text color="var(--appsmith-color-orange-500)" type={TextType.P3}>
              jsDelivr
            </Text>{" "}
            or{" "}
            <Text color="var(--appsmith-color-orange-500)" type={TextType.P3}>
              UNPKG
            </Text>
          </Text>
          <Text type={TextType.P3}>
            Learn more about Custom JS Libraries here.
          </Text>
        </div>
        <InstallationProgress />
        <div className="pl-6 pb-3 pt-4 sticky top-0 z-2 bg-white">
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
                  AngularJS module for common ARIA attributes that convey state
                  or semantic information about the application for users of
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
      </div>
    </Wrapper>
  );
}
