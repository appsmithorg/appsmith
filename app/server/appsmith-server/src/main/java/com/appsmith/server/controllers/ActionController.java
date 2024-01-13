package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ActionControllerCE;
import com.appsmith.server.helpers.OtlpTelemetry;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionExecutionSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ACTION_URL)
@Slf4j
public class ActionController extends ActionControllerCE {

    public ActionController(
            LayoutActionService layoutActionService,
            NewActionService newActionService,
            RefactoringService refactoringService,
            ActionExecutionSolution actionExecutionSolution,
            OtlpTelemetry otlpTelemetry) {

        super(layoutActionService, newActionService, refactoringService, actionExecutionSolution, otlpTelemetry);
    }
}
