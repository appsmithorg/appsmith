package com.appsmith.server.newpages.onload;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExecutableOnPageLoadServiceImpl extends ExecutableOnPageLoadServiceCEImpl
        implements ExecutableOnLoadService<NewPage> {
    public ExecutableOnPageLoadServiceImpl(
            NewActionService newActionService,
            NewPageService newPageService,
            ApplicationService applicationService,
            ActionPermission actionPermission,
            PagePermission pagePermission,
            ObservationRegistry observationRegistry) {
        super(
                newActionService,
                newPageService,
                applicationService,
                actionPermission,
                pagePermission,
                observationRegistry);
    }
}
