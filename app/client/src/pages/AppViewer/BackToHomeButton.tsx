import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router";
import AppsIcon from "remixicon-react/Apps2LineIcon";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

function BackToHomeButton() {
  const history = useHistory();
  const currentUser = useSelector(getCurrentUser);

  // if user is not logged in, don't render anything
  if (currentUser?.username == ANONYMOUS_USERNAME) return null;

  return (
    <button
      onClick={() => {
        history.push("/applications");
      }}
    >
      <AppsIcon className="w-5 h-5" />
    </button>
  );
}

export default BackToHomeButton;
