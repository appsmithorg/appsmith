package com.appsmith.server.newactions.helpers;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Component;

@Component
public class NewActionHelperCE {

    public void validateCreatorId(ActionDTO action) {
        if (action.getPageId() == null || action.getPageId().isBlank()) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID);
        }
    }
}
