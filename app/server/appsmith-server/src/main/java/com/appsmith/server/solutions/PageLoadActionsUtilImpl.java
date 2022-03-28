package com.appsmith.server.solutions;

import com.appsmith.server.services.NewActionService;
import com.appsmith.server.solutions.ce.PageLoadActionsUtilCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PageLoadActionsUtilImpl extends PageLoadActionsUtilCEImpl implements PageLoadActionsUtil {

    public PageLoadActionsUtilImpl(NewActionService newActionService) {
        super(newActionService);
    }
}
