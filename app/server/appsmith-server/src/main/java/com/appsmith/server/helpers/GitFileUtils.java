package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.helpers.ce.GitFileUtilsCE;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Import({FileUtilsImpl.class})
public class GitFileUtils extends GitFileUtilsCE {

    public GitFileUtils(
            FileInterface fileUtils,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            ActionService actionService,
            ActionCollectionService actionCollectionService,
            Gson gson) {
        super(fileUtils, analyticsService, sessionUserService, actionService, actionCollectionService, gson);
    }
}
