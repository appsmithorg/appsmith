import React from "react";
import { Flex } from "design-system";
// import { useRouteMatch } from "react-router";
// import { SentryRoute } from "@appsmith/AppRouter";
// import QueriesSegment from "./Query";
// import WidgetsSegment from "./UI";
// import JSSegment from "./JS";
import SegmentedHeader from "./components/SegmentedHeader";
import EditorTabs from "../EditorTabs/SplitScreenTabs";
// import {
//   jsSegmentRoutes,
//   querySegmentRoutes,
//   widgetSegmentRoutes,
// } from "@appsmith/pages/Editor/IDE/EditorPane/constants";
// import {
//   BUILDER_CUSTOM_PATH,
//   BUILDER_PATH,
//   BUILDER_PATH_DEPRECATED,
// } from "@appsmith/constants/routes/appRoutes";

const EditorPaneSegments = () => {
  // const { path } = useRouteMatch();

  return (
    <Flex
      flexDirection="column"
      gap="spacing-2"
      height="100%"
      overflow="hidden"
    >
      <SegmentedHeader />
      <EditorTabs />
    </Flex>
  );
};

export default EditorPaneSegments;
