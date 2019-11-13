package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.USER_URL)
public class UserController extends BaseController<UserService, User, String> {

    @Autowired
    public UserController(UserService service) {
        super(service);
    }

    @PutMapping("/switchOrganization/{orgId}")
    public Mono<ResponseDTO<User>> setCurrentOrganization(@PathVariable String orgId) {
        return service.switchCurrentOrganization(orgId)
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    @PutMapping("/addOrganization/{orgId}")
    public Mono<ResponseDTO<User>> addUserToOrganization(@PathVariable String orgId) {
        return service.addUserToOrganization(orgId)
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }
}
