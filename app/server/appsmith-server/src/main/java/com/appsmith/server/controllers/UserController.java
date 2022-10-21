package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.UserControllerCE;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.UserManagementService;
import com.appsmith.server.solutions.UserSignup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping(Url.USER_URL)
@Slf4j
public class UserController extends UserControllerCE {

    private final UserManagementService userManagementService;

    public UserController(UserService service,
                          SessionUserService sessionUserService,
                          UserWorkspaceService userWorkspaceService,
                          UserSignup userSignup,
                          UserDataService userDataService,
                          UserManagementService userManagementService) {

        super(service, sessionUserService, userWorkspaceService, userSignup, userDataService);
        this.userManagementService = userManagementService;
    }

    @GetMapping("/manage/all")
    public Mono<ResponseDTO<List<UserForManagementDTO>>> getAllUsersForManagement() {
        return userManagementService.getAllUsers()
                .map(map -> new ResponseDTO<>(HttpStatus.OK.value(), map, null));
    }

    @GetMapping("/manage/{userId}")
    public Mono<ResponseDTO<UserForManagementDTO>> getUserForManagement(@PathVariable String userId) {
        return userManagementService.getUserById(userId)
                .map(map -> new ResponseDTO<>(HttpStatus.OK.value(), map, null));
    }

    @DeleteMapping("/id/{id}")
    public Mono<ResponseDTO<Boolean>> deleteUser(@PathVariable String id) {
        log.debug("Going to delete user with id: {}", id);
        return userManagementService.deleteUser(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }
}
