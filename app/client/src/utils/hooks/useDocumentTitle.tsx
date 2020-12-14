import { useEffect } from "react";

const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
};

export default useDocumentTitle;
