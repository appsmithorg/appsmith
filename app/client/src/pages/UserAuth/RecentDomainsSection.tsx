import { Button, Text } from "@appsmith/ads";
import {
  createMessage,
  YOU_VE_ALREADY_SIGNED_INTO,
} from "ee/constants/messages";
import React from "react";
import { getRecentDomains, isValidAppsmithDomain } from "utils/multiOrgDomains";

const RecentDomainsSection: React.FC = () => {
  const recentDomains = getRecentDomains();

  if (recentDomains.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="mb-2">
        <Text kind="body-m">{createMessage(YOU_VE_ALREADY_SIGNED_INTO)}</Text>
      </div>

      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md py-4 px-3">
        {recentDomains.map((domain, index) => {
          const orgName = domain
            .split(".")[0]
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          const avatarLetter = orgName.charAt(0).toUpperCase();

          const isLastItem = index === recentDomains.length - 1;

          return (
            <div
              className={`flex items-center justify-between p-1 ${
                isLastItem ? "mb-0" : "mb-3"
              }`}
              key={domain}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[color:var(--ads-color-background-secondary)] rounded-full flex items-center justify-center text-gray-600 font-light text-sm">
                  {avatarLetter}
                </div>
                <div className="flex flex-col">
                  <span className="text-md font-semibold text-gray-700 max-w-[180px] line-clamp-1">
                    {orgName}
                  </span>
                  <span className="text-xs font-light text-gray-500 max-w-[180px] line-clamp-1">
                    {domain}
                  </span>
                </div>
              </div>
              <Button
                className="px-4 py-2 text-sm"
                kind="secondary"
                onClick={() => {
                  if (isValidAppsmithDomain(domain)) {
                    window.location.href = `https://${domain}/user/login`;
                  }
                }}
                size="md"
              >
                Open
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentDomainsSection;
