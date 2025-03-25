package com.appsmith.server.postpublishhooks;

import com.appsmith.server.domains.Application;
import com.appsmith.server.postpublishhooks.base.PostPublishHookCoordinatorService;
import com.appsmith.server.postpublishhooks.base.PostPublishHookable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service responsible for coordinating post-publish hooks for different entity types.
 * This service delegates to the appropriate specialized services based on entity type.
 */
@Slf4j
@Service
public class ApplicationPostPublishHookCoordinatorServiceImpl extends ApplicationPostPublishHookCoordinatorServiceCEImpl
        implements PostPublishHookCoordinatorService<Application> {

    public ApplicationPostPublishHookCoordinatorServiceImpl(
            List<PostPublishHookable<Application, ?>> postPublishHookables) {
        super(postPublishHookables);
    }
}
