import React from "react";

import PreviewBox from "./PreviewBox";
import { importRemixIcon } from "design-system-old";

const UserIcon = importRemixIcon(() => import("remixicon-react/User3FillIcon"));

const DashboardThumbnail = () => {
  return (
    <PreviewBox
      className="items-center p-4 bg-gray-100 "
      title="Dashboard Thumbnail"
    >
      <div className="flex items-center justify-between w-full h-full gap-2 px-5 bg-white">
        <p>Application name</p>
        <div className="p-2 border rounded-full">
          <UserIcon className="w-3 h-3 " />
        </div>
      </div>
    </PreviewBox>
  );
};

export default DashboardThumbnail;
