import { CommentThread } from "entities/Comments/CommentsInterfaces";
import {
  BUILDER_PAGE_URL,
  getApplicationViewerPageURL,
} from "constants/routes";
import { APP_MODE } from "reducers/entityReducers/appReducer";
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
  const boundingClientRect = containerRef.getBoundingClientRect();
  const containerPosition = {
    left: boundingClientRect.left,
    top: boundingClientRect.top,
  };
  const clickPosition = {
    left: clickEvent.clientX,
    top: clickEvent.clientY,
  };

  const offsetLeft = clickPosition.left - containerPosition.left;
  const offsetTop = clickPosition.top - containerPosition.top;

  const offsetLeftPercent = parseFloat(
    `${(offsetLeft / boundingClientRect.width) * 100}`,
  );
  const offsetTopPercent = parseFloat(
    `${(offsetTop / boundingClientRect.height) * 100}`,
  );

  return {
    leftPercent: offsetLeftPercent,
    topPercent: offsetTopPercent,
    left: offsetLeft,
    top: offsetTop,
  };
};

export const getCommentThreadURL = ({
  applicationId,
  commentThreadId,
  isResolved,
  pageId,
  mode = APP_MODE.PUBLISHED,
}: {
  applicationId?: string;
  commentThreadId: string;
  isResolved?: boolean;
  pageId?: string;
  mode?: APP_MODE;
}) => {
  const queryParams: Record<string, any> = {
    commentThreadId,
    isCommentMode: true,
  };

  if (isResolved) {
    queryParams.isResolved = true;
  }

  const urlBuilder =
    mode === APP_MODE.PUBLISHED
      ? getApplicationViewerPageURL
      : BUILDER_PAGE_URL;

  const url = new URL(
    `${window.location.origin}${urlBuilder(
      applicationId,
      pageId,
      queryParams,
    )}`,
  );

  return url;
};

/**
 * Absolutely position the pins within the
 * main container canvas since the height
 * can change dynamically
 */
export const getPosition = (props: {
  top: number;
  left: number;
  leftPercent: number;
  topPercent: number;
  positionAbsolutely: boolean;
  xOffset?: number;
  yOffset?: number;
  offset?: number;
}) => {
  const xOffset = props.xOffset || props.offset || 0;
  const yOffset = props.yOffset || props.offset || 0;
  if (props.positionAbsolutely) {
    return `
      top: ${props.top - 29}px;
      left: ${props.left - 29}px;
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
