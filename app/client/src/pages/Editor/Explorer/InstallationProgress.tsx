import { AppState } from "ce/reducers";
import classNames from "classnames";
import { Text, TextType } from "design-system";
import React from "react";
import { useSelector } from "react-redux";

const installationMessages = [
  (lib?: string) => `Checking compatibility - ${lib}`,
  (lib?: string) => `Downloading ${lib}`,
  (lib?: string) => `Generating definitions ${lib}`,
];

export default function InstallationProgress() {
  const installationQueue = useSelector(
    (state: AppState) => state.ui.applications.installationQueue,
  );

  const currentInstallation = installationQueue[0];

  const progress = (installationQueue[0]?.step + 1) * 25;

  return (
    <div
      className={classNames({
        "flex fixed flex-col bottom-0 w-full bg-gray-100 items-center justify-center": true,
        "ease-in transition duration-300 py-1 px-3 h-10":
          currentInstallation?.name,
        "duration-0": !currentInstallation?.name,
      })}
    >
      {currentInstallation?.name && (
        <>
          {"step" in currentInstallation && (
            <Text
              className="overflow-hidden text-ellipsis"
              italic
              type={TextType.P2}
            >
              {installationMessages[currentInstallation.step]?.(
                currentInstallation.name,
              )}
            </Text>
          )}
          <div
            className={classNames({
              "h-3 w-full border-2 rounded bg-white": currentInstallation,
            })}
          >
            <div
              className="bg-orange-400 h-full rounded ease-in transition-all duration-300"
              style={{ width: `${isNaN(progress) ? 0 : progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
