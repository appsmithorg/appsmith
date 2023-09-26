package com.appsmith.server.newactions.onpageload;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.onpageload.executables.ExecutableOnPageLoadService;
import com.appsmith.server.solutions.ActionPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ActionOnPageLoadServiceImpl extends ActionOnPageLoadServiceCEImpl
        implements ExecutableOnPageLoadService<ActionDTO> {
    public ActionOnPageLoadServiceImpl(NewActionService newActionService, ActionPermission actionPermission) {
        super(newActionService, actionPermission);
    }
}
