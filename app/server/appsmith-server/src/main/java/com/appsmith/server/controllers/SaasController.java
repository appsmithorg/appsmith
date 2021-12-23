package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.SaasControllerCE;
import com.appsmith.server.solutions.AuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.SAAS_URL)
public class SaasController extends SaasControllerCE {

    public SaasController(AuthenticationService authenticationService) {
        super(authenticationService);
    }

}
