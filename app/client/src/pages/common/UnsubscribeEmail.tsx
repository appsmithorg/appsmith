import React from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { unsubscribeCommentThreadAction } from "actions/commentActions";
import { useDispatch, useSelector } from "react-redux";
import { isUnsubscribedSelector } from "selectors/commentsSelectors";
import {
  createMessage,
  UNSUBSCRIBE_EMAIL_SUCCESS,
  UNSUBSCRIBE_EMAIL_MSG_1,
  UNSUBSCRIBE_EMAIL_MSG_2,
  UNSUBSCRIBE_EMAIL_CONFIRM_MSG,
  UNSUBSCRIBE_BUTTON_LABEL,
} from "@appsmith/constants/messages";

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
          <p>{createMessage(UNSUBSCRIBE_EMAIL_SUCCESS)}</p>
        ) : (
          <>
            <p>{createMessage(UNSUBSCRIBE_EMAIL_MSG_1)}</p>
            <p>{createMessage(UNSUBSCRIBE_EMAIL_MSG_2)}</p>
            <p>{createMessage(UNSUBSCRIBE_EMAIL_CONFIRM_MSG)}</p>

            <UnsubscribeButton onClick={unsubscribeCommentThread}>
              {createMessage(UNSUBSCRIBE_BUTTON_LABEL)}
            </UnsubscribeButton>
          </>
        )}
      </div>
    </Wrapper>
  );
}

export default UnsubscribeEmail;
