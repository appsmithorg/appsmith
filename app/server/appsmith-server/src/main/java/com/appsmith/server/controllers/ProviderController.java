package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ProviderControllerCE;
import com.appsmith.server.services.ProviderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PROVIDER_URL)
@Slf4j
public class ProviderController extends ProviderControllerCE {

    public ProviderController(ProviderService service) {
        super(service);
    }
}
