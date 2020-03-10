package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserOrganizationService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.USER_URL)
@Slf4j
public class UserController extends BaseController<UserService, User, String> {

    private final SessionUserService sessionUserService;
    private final UserOrganizationService userOrganizationService;

    @Autowired
    public UserController(UserService service,
                          SessionUserService sessionUserService,
                          UserOrganizationService userOrganizationService) {
        super(service);
        this.sessionUserService = sessionUserService;
        this.userOrganizationService = userOrganizationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<User>> create(@Valid @RequestBody User resource,
                                          @RequestHeader(name = "Origin", required = false) String originHeader) {
        return service.createUser(resource, originHeader)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PutMapping("/switchOrganization/{orgId}")
    public Mono<ResponseDTO<User>> setCurrentOrganization(@PathVariable String orgId) {
        return service.switchCurrentOrganization(orgId)
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    @PutMapping("/addOrganization/{orgId}")
    public Mono<ResponseDTO<User>> addUserToOrganization(@PathVariable String orgId) {
        return userOrganizationService.addUserToOrganization(orgId, null)
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    /**
     * This function initiates the process to reset a user's password. We require the Origin header from the request
     * in order to construct client facing URLs that will be sent to the user over email.
     *
     * @param userPasswordDTO
     * @param originHeader    The Origin header in the request. This is a mandatory parameter.
     * @return
     */
    @PostMapping("/forgotPassword")
    public Mono<ResponseDTO<Boolean>> forgotPasswordRequest(@RequestBody ResetUserPasswordDTO userPasswordDTO,
                                                            @RequestHeader("Origin") String originHeader) {
        userPasswordDTO.setBaseUrl(originHeader);
        return service.forgotPasswordTokenGenerate(userPasswordDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/verifyPasswordResetToken")
    public Mono<ResponseDTO<Boolean>> verifyPasswordResetToken(@RequestParam String email, @RequestParam String token) {
        return service.verifyPasswordResetToken(email, token)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PutMapping("/resetPassword")
    public Mono<ResponseDTO<Boolean>> resetPasswordAfterForgotPassword(@RequestBody ResetUserPasswordDTO userPasswordDTO) {
        return service.resetPasswordAfterForgotPassword(userPasswordDTO.getToken(), userPasswordDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @Deprecated
    @GetMapping("/me")
    public Mono<ResponseDTO<User>> getUserProfile() {
        return sessionUserService.getCurrentUser()
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    @GetMapping("/profile")
    public Mono<ResponseDTO<UserProfileDTO>> getEnhancedUserProfile() {
        return service.getUserProfile()
                .map(user -> new ResponseDTO<>(HttpStatus.OK.value(), user, null));
    }

    /**
     * This function creates an invite for a new user to join the Appsmith platform. We require the Origin header
     * in order to construct client facing URLs that will be sent to the user via email.
     *
     * @param user         The user object for the new user being invited to the Appsmith platform
     * @param originHeader Origin header in the request
     * @return
     */
    @PostMapping("/invite")
    public Mono<ResponseDTO<User>> inviteUser(@RequestBody User user, @RequestHeader("Origin") String originHeader) {
        return service.inviteUser(user, originHeader)
                .map(resUser -> new ResponseDTO<>(HttpStatus.OK.value(), resUser, null));
    }

    @GetMapping("/invite/verify")
    public Mono<ResponseDTO<Boolean>> verifyInviteToken(@RequestParam String email, @RequestParam String token) {
        return service.verifyInviteToken(email, token)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PutMapping("/invite/confirm")
    public Mono<ResponseDTO<Boolean>> confirmInviteUser(@RequestBody InviteUser inviteUser) {
        return service.confirmInviteUser(inviteUser)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }
}
