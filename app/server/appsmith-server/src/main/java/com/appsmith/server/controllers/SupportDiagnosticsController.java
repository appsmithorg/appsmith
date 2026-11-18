package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.SupportDiagnosticsControllerCE;
import com.appsmith.server.diagnostics.SupportDiagnosticsService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.SUPPORT_DIAGNOSTICS_URL)
public class SupportDiagnosticsController extends SupportDiagnosticsControllerCE {

    public SupportDiagnosticsController(SupportDiagnosticsService supportDiagnosticsService) {
        super(supportDiagnosticsService);
    }
}
