package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.DatasourceControllerCE;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.solutions.AuthenticationService;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.server.solutions.DatasourceTriggerSolution;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.DATASOURCE_URL)
public class DatasourceController extends DatasourceControllerCE {

    public DatasourceController(DatasourceService service,
                                DatasourceStructureSolution datasourceStructureSolution,
                                AuthenticationService authenticationService,
                                MockDataService datasourceService,
                                DatasourceTriggerSolution datasourceTriggerSolution) {

        super(service, datasourceStructureSolution, authenticationService, datasourceService, datasourceTriggerSolution);
    }
}
