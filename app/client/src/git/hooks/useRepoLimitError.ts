import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { selectRepoLimitErrorModalOpen } from "git/store/selectors/gitGlobalSelectors";
import { useDispatch, useSelector } from "react-redux";

export default function useRepoLimitError() {
  const dispatch = useDispatch();

  const repoLimitErrorModalOpen = useSelector(selectRepoLimitErrorModalOpen);

  const toggleRepoLimitErrorModal = (open: boolean) => {
    dispatch(gitGlobalActions.toggleRepoLimitErrorModal({ open }));
  };

  return {
    isRepoLimitErrorModalOpen: repoLimitErrorModalOpen ?? false,
    toggleRepoLimitErrorModal,
  };
}
