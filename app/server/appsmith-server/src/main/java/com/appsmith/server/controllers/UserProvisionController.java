package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.PROVISION_USER_URL)
public class UserProvisionController {
    private final UserService userService;
    private final UserAndAccessManagementService userAndAccessManagementService;

    public UserProvisionController(
            UserService userService, UserAndAccessManagementService userAndAccessManagementService) {
        this.userService = userService;
        this.userAndAccessManagementService = userAndAccessManagementService;
    }

    @GetMapping
    public Mono<ResponseDTO<PagedDomain<ProvisionResourceDto>>> getAllUsers(
            @RequestParam MultiValueMap<String, String> queryParams) {
        return userService
                .getProvisionUsers(queryParams)
                .map(provisionUsers -> new ResponseDTO<>(HttpStatus.OK.value(), provisionUsers, null));
    }

    @GetMapping("/{id}")
    public Mono<ResponseDTO<ProvisionResourceDto>> getUser(@PathVariable String id) {
        return userService.getProvisionUser(id).map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    @PostMapping
    public Mono<ResponseDTO<ProvisionResourceDto>> createUser(@RequestBody User user) {
        return userService
                .createProvisionUser(user)
                .map(createdUser -> new ResponseDTO<>(HttpStatus.CREATED.value(), createdUser, null));
    }

    @PutMapping("/{userId}")
    public Mono<ResponseDTO<ProvisionResourceDto>> updateUser(
            @PathVariable String userId, @RequestBody UserUpdateDTO userUpdateDTO) {
        return userService
                .updateProvisionUser(userId, userUpdateDTO)
                .map(updatedUser -> new ResponseDTO<>(HttpStatus.OK.value(), updatedUser, null));
    }

    @DeleteMapping("/{userId}")
    public Mono<ResponseDTO<String>> deleteUser(@PathVariable String userId) {
        return userAndAccessManagementService
                .deleteProvisionUser(userId)
                .map(deleted -> new ResponseDTO<>(HttpStatus.NO_CONTENT.value(), null, null));
    }
}
