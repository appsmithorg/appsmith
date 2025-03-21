package com.appsmith.server.newactions.postpublishhooks;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.postpublishhooks.base.PostPublishHookableCE;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class NewActionPostApplicationPublishServiceCEImpl implements PostPublishHookableCE<Application, NewAction> {

    @Override
    public Class<NewAction> getEntityType() {
        return NewAction.class;
    }

    @Override
    public Class<Application> getArtifactType() {
        return Application.class;
    }
}
