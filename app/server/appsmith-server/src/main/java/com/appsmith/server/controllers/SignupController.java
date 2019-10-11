package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.SignupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.SIGNUP_URL)
public class SignupController {
    private final SignupService signupService;

    @Autowired
    public SignupController(SignupService signupService) {
        this.signupService = signupService;
    }

    @PostMapping("/organization")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Organization>> signupOrganization(@RequestBody Organization organization) {
        return signupService.createOrganization(organization)
                .map(org -> new ResponseDTO<>(HttpStatus.CREATED.value(), org, null));
    }

}
