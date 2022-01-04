package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.GitControllerCE;
import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController extends GitControllerCE {

    public GitController(GitService service) {
        super(service);
    }

}
