package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.UsagePulseControllerCE;
import com.appsmith.server.services.UsagePulseService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.USAGE_PULSE_URL)
public class UsagePulseController extends UsagePulseControllerCE {

    public UsagePulseController(UsagePulseService service) {
        super(service);
    }

}
