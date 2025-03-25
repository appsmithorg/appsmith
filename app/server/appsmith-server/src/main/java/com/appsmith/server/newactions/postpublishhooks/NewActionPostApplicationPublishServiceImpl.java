package com.appsmith.server.newactions.postpublishhooks;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.postpublishhooks.base.PostPublishHookable;
import org.springframework.stereotype.Service;

@Service
public class NewActionPostApplicationPublishServiceImpl extends NewActionPostApplicationPublishServiceCEImpl
        implements PostPublishHookable<Application, NewAction> {

    public NewActionPostApplicationPublishServiceImpl() {
        super();
    }
}
