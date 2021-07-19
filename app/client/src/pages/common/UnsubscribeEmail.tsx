import React from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { unsubscribeCommentThreadAction } from "actions/commentActions";
import { useDispatch, useSelector } from "react-redux";
import { isUnsubscribedSelector } from "selectors/commentsSelectors";

const Wrapper = styled.div`
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  background-color: #fafafa;
  text-align: center;
  padding-top: calc(${(props) => props.theme.headerHeight} + 50px);
  .bold-text {
    font-weight: ${(props) => props.theme.fontWeights[3]};
    font-size: 24px;
  }
  .button-position {
    margin: auto;
  }
`;
const UnsubscribeButton = styled.button`
  background-color: #f3672a;
  color: white;
  height: 40px;
  width: 300px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 17px;
  margin-top: 40px;
`;

function UnsubscribeEmail() {
  const params = useParams<{ threadId: string }>();
  const dispatch = useDispatch();
  const isUnsubscribed = useSelector(isUnsubscribedSelector);

  const unsubscribeCommentThread = () => {
    dispatch(unsubscribeCommentThreadAction(params.threadId));
  };

  return (
    <Wrapper>
      <div>
        <p className="bold-text">Unsubscribe</p>
        {isUnsubscribed ? (
          <p>
            You&apos;ve successfully unsubscribed from the corresponding comment
            thread
          </p>
        ) : (
          <>
            <p>
              You will not receive any more email notifications for the
              corresponding comment thread.
            </p>
            <p>
              Please note that you&apos;ll be subscribed again if someone tags
              you in a comment or you reply to a comment.
            </p>
            <p>Are you sure you want to unsubscribe?</p>

            <UnsubscribeButton onClick={unsubscribeCommentThread}>
              {"Unsubscribe me"}
            </UnsubscribeButton>
          </>
        )}
      </div>
    </Wrapper>
  );
}

export default UnsubscribeEmail;
