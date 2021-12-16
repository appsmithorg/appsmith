package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.AssetControllerCE;
import com.appsmith.server.services.AssetService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ASSET_URL)
public class AssetController extends AssetControllerCE {

    public AssetController(AssetService service) {
        super(service);
    }
}
