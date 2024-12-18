import React from "react";
import LocalProfileView from "./LocalProfileView";
import useLocalProfile from "git/hooks/useLocalProfile";
import useGlobalProfile from "git/hooks/useGlobalProfile";

function LocalProfile() {
  const {
    fetchLocalProfile,
    isFetchLocalProfileLoading,
    localProfile,
    updateLocalProfile,
  } = useLocalProfile();

  const { fetchGlobalProfile, globalProfile, isFetchGlobalProfileLoading } =
    useGlobalProfile();

  return (
    <LocalProfileView
      fetchGlobalProfile={fetchGlobalProfile}
      fetchLocalProfile={fetchLocalProfile}
      globalProfile={globalProfile}
      isFetchGlobalProfileLoading={isFetchGlobalProfileLoading}
      isFetchLocalProfileLoading={isFetchLocalProfileLoading}
      localProfile={localProfile}
      updateLocalProfile={updateLocalProfile}
    />
  );
}

export default LocalProfile;
