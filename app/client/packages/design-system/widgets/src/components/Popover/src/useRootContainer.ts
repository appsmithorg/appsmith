import { useEffect } from "react";

import { useState } from "react";

export const useRootContainer = () => {
  const [root, setRoot] = useState<Element | undefined>(
    document.body.querySelector("[data-theme-provider]") as Element,
  );

  useEffect(() => {
    if (!root) {
      setRoot(document.body.querySelector("[data-theme-provider]") as Element);
    }
  }, []);

  return root;
};
