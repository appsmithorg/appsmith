import log from "loglevel";
import { useCallback } from "react";

import type { Module } from "@appsmith/constants/ModuleConstants";
import type { Package } from "@appsmith/constants/PackageConstants";

const KEY = "APPSMITH_LAST_VISITED_MODULE_KEY";

type LastVisited = Record<Package["id"], Module["id"] | undefined>;
interface LogLastVisitedProps {
  moduleId: Module["id"];
}

interface UseLastVisitedProps {
  packageId: Package["id"];
}

const getValues = () => {
  try {
    const values = localStorage.getItem(KEY) || "{}";

    return JSON.parse(values) as LastVisited;
  } catch (error) {
    log.error(error);

    return undefined;
  }
};

const setValues = (values: LastVisited) => {
  try {
    // Save to local storage
    localStorage.setItem(KEY, JSON.stringify(values));
  } catch (error) {
    // A more advanced implementation would handle the error case
    log.error(error);
  }
};

function useLastVisitedModule({ packageId }: UseLastVisitedProps) {
  const getLastVisited = useCallback(() => {
    const values = getValues() || {};

    return values[packageId];
  }, [getValues, packageId]);

  const logLastVisited = useCallback(
    ({ moduleId }: LogLastVisitedProps) => {
      const values = getValues() || {};

      values[packageId] = moduleId;
      setValues(values);
    },
    [packageId, getValues, setValues],
  );

  return {
    logLastVisited,
    getLastVisited,
  };
}

export default useLastVisitedModule;
