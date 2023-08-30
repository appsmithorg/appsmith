import React from "react";
// import type { AuthorInfo } from "./GitUserSettings";
import GitUserSettings from "./GitUserSettings";
// import { getGlobalGitConfig } from "selectors/gitSyncSelectors";
// import { useSelector } from "react-redux";

function GitSettings() {
  // const globalGitConfig = useSelector(getGlobalGitConfig);
  // // const localGitConfig = useSelector(getLocalGitConfig);
  // const [useGlobalConfigInputVal, setUseGlobalConfigInputVal] = useState(false);
  // const [authorInfo, setAuthorInfo] = useState<AuthorInfo>({
  //   authorName: "",
  //   authorEmail: "",
  // });

  return (
    <div>
      <GitUserSettings />
    </div>
  );
}

export default GitSettings;
