import React, { useCallback } from "react";
import {
  getActiveGitSyncModalTab,
  getIsGitConnected,
  getIsGitSyncModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { setWorkspaceIdForImport } from "@appsmith/actions/applicationActions";
import Menu from "../Menu";
import Deploy from "../Tabs/Deploy";
import Merge from "../Tabs/Merge";

import GitErrorPopup from "../components/GitErrorPopup";
import styled from "styled-components";

import {
  CONFIGURE_GIT,
  createMessage,
  DEPLOY,
  DEPLOY_YOUR_APPLICATION,
  MERGE,
  MERGE_CHANGES,
  SETTINGS_GIT,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Modal, ModalContent, ModalHeader } from "design-system";
import { EnvInfoHeader } from "@appsmith/components/EnvInfoHeader";
import GitConnectionV2 from "../Tabs/GitConnectionV2";
import GitSettings from "../Tabs/GitSettings";
import { GitSyncModalTab } from "entities/GitSync";
import ConnectionSuccess from "../Tabs/ConnectionSuccess";

// const ModalContentContainer = styled(ModalContent)`
//   min-height: 650px;
// `;
// const ComponentsByTab: Record<GitSyncModalTab, any> = {
//   [GitSyncModalTab.DEPLOY]: Deploy,
//   [GitSyncModalTab.MERGE]: Merge,
//   [GitSyncModalTab.SETTINGS]: GitSettings,
// };

export const modalTitle = {
  [GitSyncModalTab.GIT_CONNECTION]: createMessage(CONFIGURE_GIT),
  [GitSyncModalTab.DEPLOY]: createMessage(DEPLOY_YOUR_APPLICATION),
  [GitSyncModalTab.MERGE]: createMessage(MERGE_CHANGES),
  [GitSyncModalTab.SETTINGS]: createMessage(SETTINGS_GIT),
};

const menuOptions = [
  {
    key: GitSyncModalTab.DEPLOY,
    title: createMessage(DEPLOY),
  },
  {
    key: GitSyncModalTab.MERGE,
    title: createMessage(MERGE),
  },
  {
    key: GitSyncModalTab.SETTINGS,
    title: createMessage(SETTINGS_GIT),
  },
];

const possibleMenuOptions = menuOptions.map((option) => option.key);

interface GitSyncModalV2Props {
  isImport?: boolean;
}

function GitSyncModalV2({ isImport = false }: GitSyncModalV2Props) {
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const isGitConnected = useSelector(getIsGitConnected);

  let activeTabKey = useSelector(getActiveGitSyncModalTab);
  if (!isGitConnected && activeTabKey !== GitSyncModalTab.GIT_CONNECTION) {
    activeTabKey = GitSyncModalTab.GIT_CONNECTION;
  }

  const dispatch = useDispatch();

  const setActiveTabKey = useCallback(
    (tabKey: GitSyncModalTab) => {
      if (tabKey === GitSyncModalTab.DEPLOY) {
        AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
          source: `${activeTabKey}_TAB`,
        });
      } else if (tabKey === GitSyncModalTab.MERGE) {
        AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
          source: `${activeTabKey}_TAB`,
        });
      } else if (tabKey === GitSyncModalTab.SETTINGS) {
        AnalyticsUtil.logEvent("GS_SETTINGS_GIT_MODAL_TRIGGERED", {
          source: `${activeTabKey}_TAB`,
        });
      }
      dispatch(setIsGitSyncModalOpen({ isOpen: isModalOpen, tab: tabKey }));
    },
    [dispatch, setIsGitSyncModalOpen, isModalOpen],
  );

  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(setWorkspaceIdForImport(""));
  }, [dispatch, setIsGitSyncModalOpen]);

  return (
    <>
      <Modal
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        open={isModalOpen}
      >
        <ModalContent
          data-testid="t--git-sync-modal"
          style={{ width: "640px" }}
        >
          <ModalHeader>{modalTitle[activeTabKey]}</ModalHeader>
          <EnvInfoHeader />
          {possibleMenuOptions.includes(activeTabKey) && (
            <Menu
              activeTabKey={activeTabKey}
              onSelect={(tabKey: string) =>
                setActiveTabKey(tabKey as GitSyncModalTab)
              }
              options={menuOptions}
            />
          )}
          {activeTabKey === GitSyncModalTab.GIT_CONNECTION &&
            (!isGitConnected ? <GitConnectionV2 /> : <ConnectionSuccess />)}
          {activeTabKey === GitSyncModalTab.DEPLOY && <Deploy />}
          {activeTabKey === GitSyncModalTab.MERGE && <Merge />}
          {activeTabKey === GitSyncModalTab.SETTINGS && <GitSettings />}
        </ModalContent>
      </Modal>
      <GitErrorPopup />
    </>
  );
}

// function GitSyncModalV2(props: { isImport?: boolean }) {
//   const dispatch = useDispatch();
//   const isModalOpen = useSelector(getIsGitSyncModalOpen);
//   const isGitConnected = useSelector(getIsGitConnected);
//   const activeTabKey = useSelector(getActiveGitSyncModalTab);
//   //   const { onGitConnectFailure: resetGitConnectStatus } = useGitConnect();

//   const isGitConnectV2Enabled = true;
//   ComponentsByTab[GitSyncModalTab.GIT_CONNECTION] = isGitConnectV2Enabled
//     ? GitConnectionV2
//     : GitConnection;
//   MENU_ITEMS_MAP[GitSyncModalTab.GIT_CONNECTION] = {
//     key: GitSyncModalTab.GIT_CONNECTION,
//     title: createMessage(
//       isGitConnectV2Enabled ? CONFIGURE_GIT : GIT_CONNECTION,
//     ),
//     modalTitle: createMessage(
//       isGitConnectV2Enabled ? CONFIGURE_GIT : CONNECT_TO_GIT,
//     ),
//   };

//   const handleClose = useCallback(() => {
//     // resetGitConnectStatus();
//     dispatch(setIsGitSyncModalOpen({ isOpen: false }));
//     dispatch(setWorkspaceIdForImport(""));
//   }, [dispatch, setIsGitSyncModalOpen]);

//   const setActiveTabKey = useCallback(
//     (tabKey: GitSyncModalTab) => {
//       if (tabKey === GitSyncModalTab.DEPLOY) {
//         AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
//           source: `${activeTabKey}_TAB`,
//         });
//       } else if (tabKey === GitSyncModalTab.MERGE) {
//         AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
//           source: `${activeTabKey}_TAB`,
//         });
//       }
//       // else if (tabKey === GitSyncModalTab.SETTINGS) {
//       //   AnalyticsUtil.logEvent("GS_SETTINGS_GIT_MODAL_TRIGGERED", {
//       //     source: `${activeTabKey}_TAB`,
//       //   });
//       // }
//       dispatch(setIsGitSyncModalOpen({ isOpen: isModalOpen, tab: tabKey }));
//     },
//     [dispatch, setIsGitSyncModalOpen, isModalOpen],
//   );

//   useEffect(() => {
//     if (!isGitConnected && activeTabKey !== GitSyncModalTab.GIT_CONNECTION) {
//       setActiveTabKey(GitSyncModalTab.DEPLOY);
//     }
//   }, [activeTabKey]);

//   useEffect(() => {
//     // when git connected
//     if (isGitConnected && activeTabKey === GitSyncModalTab.GIT_CONNECTION) {
//       setActiveTabKey(GitSyncModalTab.DEPLOY);
//     }
//   }, [isGitConnected]);

//   let menuOptions = menuOptions;
//   if (props.isImport) {
//     menuOptions = [
//       {
//         key: GitSyncModalTab.GIT_CONNECTION,
//         modalTitle: createMessage(IMPORT_FROM_GIT_REPOSITORY),
//         title: createMessage(GIT_IMPORT),
//       },
//     ];
//   } else {
//     menuOptions = isGitConnected
//       ? menuOptions
//       : [MENU_ITEMS_MAP.GIT_CONNECTION];
//   }

//   useEffect(() => {
//     // onMount or onChange of activeTabKey
//     if (
//       activeTabKey !== GitSyncModalTab.GIT_CONNECTION &&
//       menuOptions.findIndex((option) => option.key === activeTabKey) === -1
//     ) {
//       setActiveTabKey(GitSyncModalTab.GIT_CONNECTION);
//     }
//   }, [activeTabKey]);

//   const BodyComponent =
//     ComponentsByTab[activeTabKey || GitSyncModalTab.GIT_CONNECTION];

//   return (
//     <>
//       <Modal
//         onOpenChange={(open) => {
//           if (!open) {
//             handleClose();
//           }
//         }}
//         open={isModalOpen}
//       >
//         <ModalContentContainer
//           data-testid="t--git-sync-modal"
//           style={{ width: "640px" }}
//         >
//           <ModalHeader>
//             {MENU_ITEMS_MAP[activeTabKey]?.modalTitle ?? ""}
//           </ModalHeader>
//           <EnvInfoHeader />
//           {!(
//             isGitConnectV2Enabled &&
//             activeTabKey === GitSyncModalTab.GIT_CONNECTION
//           ) ? (
//             <Menu
//               activeTabKey={activeTabKey}
//               onSelect={(tabKey: string) =>
//                 setActiveTabKey(tabKey as GitSyncModalTab)
//               }
//               options={menuOptions}
//             />
//           ) : null}
//           {activeTabKey === GitSyncModalTab.GIT_CONNECTION && (
//             <BodyComponent isImport={props.isImport} />
//           )}
//           {activeTabKey !== GitSyncModalTab.GIT_CONNECTION && <BodyComponent />}
//         </ModalContentContainer>
//       </Modal>
//       <GitErrorPopup />
//     </>
//   );
// }

export default GitSyncModalV2;
