package com.appsmith.server.controllers;

import com.appsmith.server.controllers.ce.IndexControllerCE;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("")
public class IndexController extends IndexControllerCE {

    public IndexController(SessionUserService service) {
        super(service);
    }
}
