import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectFetchGlobalSSHKeyState } from "git/store/selectors/gitGlobalSelectors";
import { gitGlobalActions } from "git/store/gitGlobalSlice";

export default function useGlobalSSHKey() {
  const dispatch = useDispatch();

  const globalSSHKeyState = useSelector(selectFetchGlobalSSHKeyState);

  const fetchGlobalSSHKey = useCallback(
    (keyType: string) => {
      dispatch(gitGlobalActions.fetchGlobalSSHKeyInit({ keyType }));
    },
    [dispatch],
  );

  const resetGlobalSSHKey = useCallback(() => {
    dispatch(gitGlobalActions.resetGlobalSSHKey());
  }, [dispatch]);

  return {
    globalSSHKey: globalSSHKeyState?.value ?? null,
    globalSSHKeyError: globalSSHKeyState?.error ?? null,
    isFetchGlobalSSHKeyLoading: globalSSHKeyState?.loading ?? false,
    fetchGlobalSSHKey,
    resetGlobalSSHKey,
  };
}
