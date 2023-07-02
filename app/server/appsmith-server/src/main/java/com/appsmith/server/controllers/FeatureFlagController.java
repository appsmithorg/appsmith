package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.FeatureFlagTestController;
import com.appsmith.server.services.FeatureFlagService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.FEATURE_FLAG_TEST)
public class FeatureFlagController extends FeatureFlagTestController {
    public FeatureFlagController(FeatureFlagService featureFlagService) {
        super(featureFlagService);
    }
}
