package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.MarketplaceControllerCE;
import com.appsmith.server.services.MarketplaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.MARKETPLACE_URL)
@Slf4j
public class MarketplaceController extends MarketplaceControllerCE {

    public MarketplaceController(ObjectMapper objectMapper,
                                 MarketplaceService marketplaceService) {

        super(objectMapper, marketplaceService);
    }
}
