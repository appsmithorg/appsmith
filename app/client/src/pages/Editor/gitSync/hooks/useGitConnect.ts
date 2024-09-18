import { useDispatch } from "react-redux";
import { useCallback, useState } from "react";
import type { ConnectToGitPayload } from "api/GitSyncAPI";
import { connectToGitInit } from "actions/gitSyncActions";
import noop from "lodash/noop";

export const useGitConnect = () => {
  const dispatch = useDispatch();

  const [errResponse, setErrResponse] = useState();
  const [isConnectingToGit, setIsConnectingToGit] = useState(false);

  const connectToGit = useCallback(
    (
      payload: ConnectToGitPayload,
      { onErrorCallback = noop, onSuccessCallback = noop } = {},
    ) => {
      setIsConnectingToGit(true);
      setErrResponse(undefined);
      // Here after the ssh key pair generation, we fetch the application data again and on success of it
      dispatch(
        connectToGitInit({
          payload,
          onSuccessCallback: (data) => {
            onSuccessCallback(data);
            setIsConnectingToGit(false);
          },
          onErrorCallback: (err, response) => {
            onErrorCallback(err, response);
            const errorResponse = response || err?.response?.data;

            setErrResponse(errorResponse);
            setIsConnectingToGit(false);
          },
        }),
      );
    },
    [setIsConnectingToGit],
  );

  return {
    isConnectingToGit,
    connectToGit,
    connectErrorResponse: errResponse,
  };
};
