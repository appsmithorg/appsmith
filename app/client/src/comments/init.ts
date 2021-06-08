import { updateAndSaveLayout } from "actions/pageActions";
import { uniqueId } from "lodash";

const dsl = require("./dsl.json");

export const updateLayout = () => updateAndSaveLayout(dsl.widgets as any);

export const getTestComments = () => {
  const commentThreads = Object.entries(dsl.widgets).map(([widgetId]) => {
    return {
      refId: widgetId,
      position: { top: 10, left: 15 },
      id: uniqueId(),
      comments: [{ body: widgetId, authorName: uniqueId() }],
    };
  });

  // const [widgetId] = Object.entries(dsl.widgets)[0];
  // const commentThreads = [
  //   {
  //     refId: widgetId,
  //     meta: {
  //       position: { top: 10, left: 15 },
  //     },
  //     id: `${1}`,
  //     comments: [{ body: widgetId }],
  //   },
  // ];

  return commentThreads;
};
