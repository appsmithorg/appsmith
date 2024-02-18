package com.appsmith.server.newpages.onload;

import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExecutableOnPageLoadServiceImpl extends ExecutableOnPageLoadServiceCEImpl
        implements ExecutableOnLoadService<NewPage> {
    public ExecutableOnPageLoadServiceImpl(
            ActionService actionService,
            NewPageService newPageService,
            ApplicationService applicationService,
            ActionPermission actionPermission,
            PagePermission pagePermission) {
        super(actionService, newPageService, applicationService, actionPermission, pagePermission);
    }
}
