package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.JSLib;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.CUSTOM_JS_LIB_URL)
public class CustomJSLibController extends BaseController<CustomJSLibService, JSLib, String> {

    public CustomJSLibController(CustomJSLibService service) {
        super(service);
    }
}
