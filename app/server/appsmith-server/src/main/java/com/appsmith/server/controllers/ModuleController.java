package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ActionControllerCE;
import com.appsmith.server.controllers.ce.ModuleControllerCE;
import com.appsmith.server.repositories.CustomModuleRepository;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.ModuleService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.solutions.ActionExecutionSolution;
import com.appsmith.server.solutions.RefactoringSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/modules")
@Slf4j
public class ModuleController extends ModuleControllerCE {

    public ModuleController(ModuleService moduleService,
                              ModuleRepository moduleRepository,
                            LayoutActionService layoutActionService) {
        super(moduleService, moduleRepository, layoutActionService);
    }

}
