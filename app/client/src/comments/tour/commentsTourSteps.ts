import { Position } from "@blueprintjs/core";

export const commentsTourStepsEditMode = [
  {
    id: "ENTER_COMMENTS_MODE",
    data: { message: "Click on the icon to access \n comments." },
  },
  {
    id: "CREATE_UNPUBLISHED_COMMENT",
    data: { message: "Click anywhere on the canvas \n to leave a comment." },
  },
  {
    id: "SAY_HELLO",
    data: {
      message: "Say hello to team appsmith",
      tooltipProps: { position: Position.TOP },
    },
  },
  {
    id: "RESOLVE",
    data: { message: "Resolve this comment \n when you're done" },
  },
];

export const commentsTourStepsPublishedMode = [
  {
    id: "ENTER_COMMENTS_MODE",
    data: { message: "Click on the icon to access \n comments." },
  },
  {
    id: "CREATE_UNPUBLISHED_COMMENT",
    data: { message: "Click anywhere on the canvas \n to leave a comment." },
  },
  {
    id: "SAY_HELLO",
    data: {
      message:
        "Tag your teammate and leave them \n some suggestions for the application!",
      tooltipProps: { position: Position.TOP },
    },
  },
];
