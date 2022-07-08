import { PopoverPosition } from "@blueprintjs/core/lib/esnext/components/popover/popoverSharedProps";

export enum commentsTourStepsEditModeTypes {
  ENTER_COMMENTS_MODE,
  CREATE_UNPUBLISHED_COMMENT,
  SAY_HELLO,
  RESOLVE,
}

type TooltipProp = { position: PopoverPosition };

export const commentsTourStepsEditMode = [
  {
    id: commentsTourStepsEditModeTypes.ENTER_COMMENTS_MODE,
    data: { message: "Click on the icon to access \n comments." },
  },
  {
    id: commentsTourStepsEditModeTypes.CREATE_UNPUBLISHED_COMMENT,
    data: { message: "Click anywhere on the canvas \n to leave a comment." },
  },
  {
    id: commentsTourStepsEditModeTypes.SAY_HELLO,
    data: {
      message: "type Hello",
      tooltipProps: { position: "top" } as TooltipProp,
    },
  },
  {
    id: commentsTourStepsEditModeTypes.RESOLVE,
    data: { message: "Resolve this comment \n when you're done" },
  },
];

export enum commentsTourStepsPublishedModeTypes {
  ENTER_COMMENTS_MODE,
  CREATE_UNPUBLISHED_COMMENT,
  SAY_HELLO,
}

export const commentsTourStepsPublishedMode = [
  {
    id: commentsTourStepsPublishedModeTypes.ENTER_COMMENTS_MODE,
    data: { message: "Click on the icon to access \n comments." },
  },
  {
    id: commentsTourStepsPublishedModeTypes.CREATE_UNPUBLISHED_COMMENT,
    data: { message: "Click anywhere on the canvas \n to leave a comment." },
  },
  {
    id: commentsTourStepsPublishedModeTypes.SAY_HELLO,
    data: {
      message:
        "Tag your teammate and leave them \n some suggestions for the application!",
      tooltipProps: { position: "top" } as TooltipProp,
    },
  },
];
