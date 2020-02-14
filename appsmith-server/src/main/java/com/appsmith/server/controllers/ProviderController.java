package com.appsmith.server.controllers;

import com.appsmith.external.models.Provider;
import com.appsmith.server.constants.Url;
import com.appsmith.server.services.ProviderService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PROVIDER_URL)
public class ProviderController extends BaseController<ProviderService, Provider, String> {

    public ProviderController(ProviderService service) {
        super(service);
    }
}
