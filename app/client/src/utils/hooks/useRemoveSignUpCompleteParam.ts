import { useEffect } from "react";
import history from "utils/history";

const useRemoveSignUpCompleteParam = () => {
  useEffect(() => {
    if (window.location.href) {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      if (searchParams.get("isFromSignup")) {
        searchParams.delete("isFromSignup");
        history.replace({
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
        });
      }
    }
  }, []);
};

export default useRemoveSignUpCompleteParam;
