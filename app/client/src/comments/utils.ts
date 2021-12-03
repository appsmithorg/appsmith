import { CommentThread } from "entities/Comments/CommentsInterfaces";
import {
  BUILDER_PAGE_URL,
  getApplicationViewerPageURL,
  GIT_BRANCH_QUERY_KEY,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
const WidgetTypes = WidgetFactory.widgetTypes;

// used for dev
export const reduceCommentsByRef = (comments: any[]) => {
  return comments.reduce((res, curr) => {
    return {
      commentThreadsMap: {
        ...res.commentThreadsMap,
        [curr.id]: curr,
      },
      refCommentThreads: {
        ...(res.refCommentThreads ? res.refCommentThreads : {}),
        [curr.refId]: [
          ...(res.refCommentThreads && res.refCommentThreads[curr.refId]
            ? res.refCommentThreads[curr.refId]
            : []),
          curr.id,
        ],
      },
    };
  }, {});
};

export const transformPublishedCommentActionPayload = (
  payload: any,
): Record<string, CommentThread> => {
  return {
    [payload.refId]: {
      ...payload,
      position: payload.position,
      id: "UNPUBLISHED",
    },
  };
};

export const transformUnpublishCommentThreadToCreateNew = (payload: any) => {
  const { commentBody, commentThread } = payload;
  // eslint-disable-next-line
  const { id, ...rest } = commentThread;
  return {
    ...rest,
    comments: [{ body: commentBody }],
  };
};

const getRelativePos = (
  absPosition: { x: number; y: number },
  boundingRectSizePosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  },
) => {
  const containerPosition = {
    left: boundingRectSizePosition.left,
    top: boundingRectSizePosition.top,
  };
  const offsetLeft = absPosition.x - containerPosition.left;
  const offsetTop = absPosition.y - containerPosition.top;

  const offsetLeftPercent = parseFloat(
    `${(offsetLeft / boundingRectSizePosition.width) * 100}`,
  );
  const offsetTopPercent = parseFloat(
    `${(offsetTop / boundingRectSizePosition.height) * 100}`,
  );

  return {
    leftPercent: offsetLeftPercent,
    topPercent: offsetTopPercent,
    left: offsetLeft,
    top: offsetTop,
  };
};

export const getNewDragPos = (
  absolutePos: {
    x: number;
    y: number;
  },
  boundingRectSizePosition: {
    top: number;
    left: number;
    width: number;
    height: number;
  },
) => {
  return getRelativePos(absolutePos, boundingRectSizePosition);
};

/**
 * Returns the offset position relative to the container
 * using the coordinates from the click event
 * @param clickEvent
 * @param containerRef
 */
export const getOffsetPos = (
  clickEvent: React.MouseEvent,
  containerRef: HTMLDivElement,
) => {
  const clickPosition = {
    x: clickEvent.clientX,
    y: clickEvent.clientY,
  };
  const boundingClientRect = containerRef.getBoundingClientRect();
  return getRelativePos(clickPosition, boundingClientRect);
};

export const getCommentThreadURL = ({
  applicationId,
  branch,
  commentThreadId,
  isResolved,
  pageId,
  mode = APP_MODE.PUBLISHED,
}: {
  applicationId: string;
  branch?: string;
  commentThreadId: string;
  isResolved?: boolean;
  pageId: string;
  mode?: APP_MODE;
}) => {
  const queryParams: Record<string, any> = {
    commentThreadId,
    isCommentMode: true,
  };

  if (isResolved) {
    queryParams.isResolved = true;
  }

  if (branch) {
    queryParams[GIT_BRANCH_QUERY_KEY] = branch;
  }

  const urlBuilder =
    mode === APP_MODE.PUBLISHED
      ? getApplicationViewerPageURL
      : BUILDER_PAGE_URL;

  const url = new URL(
    `${window.location.origin}${urlBuilder({
      applicationId: applicationId,
      pageId,
      params: queryParams,
    })}`,
  );

  return url;
};

/**
 * Absolutely position the pins within the
 * main container canvas since the height
 * can change dynamically
 */
export const getPosition = (props: {
  top?: number;
  left?: number;
  leftPercent: number;
  topPercent: number;
  positionAbsolutely: boolean;
  xOffset?: number;
  yOffset?: number;
  offset?: number;
}) => {
  const xOffset = props.xOffset || props.offset || 0;
  const yOffset = props.yOffset || props.offset || 0;
  const top = props.top || 0;
  const left = props.left || 0;
  if (props.positionAbsolutely) {
    return `
      top: ${top - 29}px;
      left: ${left - 29}px;
    `;
  } else {
    // The folling syntax is supported: bottom: calc(50% + -6px);
    // so we can work with both +ve and -ve offset values as
    // `calc(${100 - props.topPercent}% + ${yOffset}px);`
    return `
      bottom: calc(${100 - props.topPercent}% + ${yOffset}px);
      right: calc(${100 - props.leftPercent}% + ${xOffset}px);
    `;
  }
};

export const getShouldPositionAbsolutely = (commentThread: CommentThread) => {
  return (
    commentThread?.refId === MAIN_CONTAINER_WIDGET_ID &&
    commentThread?.widgetType === WidgetTypes.CANVAS_WIDGET
  );
};
