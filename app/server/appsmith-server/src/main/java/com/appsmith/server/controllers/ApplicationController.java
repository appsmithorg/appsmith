package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.APPLICATION_URL)
public class ApplicationController extends BaseController<ApplicationService, Application, String> {
    @Autowired
    public ApplicationController(ApplicationService service) {
        super(service);
    }

    @PostMapping("/publish/{applicationId}")
    public Mono<ResponseDTO<Boolean>> publish(@PathVariable String applicationId) {
        return service.publish(applicationId)
                .map(published -> new ResponseDTO<>(HttpStatus.OK.value(), published, null));
    }

}
