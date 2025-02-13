import React from "react";

export const LoadingIndicator = () => (
  <div className="sticky bottom-0 left-0 right-0 p-2 bg-white border-t">
    <div className="flex items-center justify-center p-2 space-x-2 bg-gray-50 rounded">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-600">Loading data...</span>
    </div>
  </div>
);
