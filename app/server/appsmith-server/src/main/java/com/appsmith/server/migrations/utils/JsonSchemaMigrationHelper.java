package com.appsmith.server.migrations.utils;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.migrations.utils.ce.JsonSchemaMigrationHelperCE;
import com.appsmith.server.newactions.base.NewActionService;
import org.springframework.stereotype.Component;

@Component
public class JsonSchemaMigrationHelper extends JsonSchemaMigrationHelperCE {

    public JsonSchemaMigrationHelper(ApplicationService applicationService, NewActionService newActionService) {
        super(applicationService, newActionService);
    }
}
