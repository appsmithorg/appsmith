package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserOrganizationService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.UserSignup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping(Url.USER_URL)
@Slf4j
public class UserController extends BaseController<UserService, User, String> {

    private final SessionUserService sessionUserService;
    private final UserOrganizationService userOrganizationService;
    private final UserSignup userSignup;
    private final UserDataService userDataService;

    @Autowired
    public UserController(UserService service,
                          SessionUserService sessionUserService,
                          UserOrganizationService userOrganizationService,
                          UserSignup userSignup,
                          UserDataService userDataService) {
        super(service);
        this.sessionUserService = sessionUserService;
        this.userOrganizationService = userOrganizationService;
        this.userSignup = userSignup;
        this.userDataService = userDataService;
    }

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<User>> create(@Valid @RequestBody User resource,
                                          @RequestHeader(name = "Origin", required = false) String originHeader,
                                          ServerWebExchange exchange) {
        return userSignup.signupAndLogin(resource, exchange)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping(consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Void> createFormEncoded(ServerWebExchange exchange) {
        return userSignup.signupAndLoginFromFormData(exchange);
    }

    @PutMapping()
    public Mono<ResponseDTO<User>> update(@RequestBody User resource, ServerWebExchange exchange) {
        return service.updateCurrentUser(resource, exchange)
                .map(updatedUser -> new ResponseDTO<>(HttpStatus.OK.value(), updatedUser, null));
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

    /**
     * This function creates an invite for new users to join an Appsmith organization. We require the Origin header
     * in order to construct client facing URLs that will be sent to the users via email.
     *
     * @param inviteUsersDTO The inviteUserDto object for the new users being invited to the Appsmith organization
     * @param originHeader Origin header in the request
     * @return List of new users who have been created/existing users who have been added to the organization.
     */
    @PostMapping("/invite")
    public Mono<ResponseDTO<List<User>>> inviteUsers(@RequestBody InviteUsersDTO inviteUsersDTO, @RequestHeader("Origin") String originHeader) {
        return service.inviteUsers(inviteUsersDTO, originHeader)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @PutMapping("/setReleaseNotesViewed")
    public Mono<ResponseDTO<Void>> setReleaseNotesViewed() {
        return sessionUserService.getCurrentUser()
                .flatMap(userDataService::setViewedCurrentVersionReleaseNotes)
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), null, null));
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<UserData>> uploadProfilePhoto(@RequestPart("file") Mono<Part> fileMono) {
        return fileMono
                .flatMap(userDataService::saveProfilePhoto)
                .map(url -> new ResponseDTO<>(HttpStatus.OK.value(), url, null));
    }

    @DeleteMapping("/photo")
    public Mono<ResponseDTO<Void>> deleteProfilePhoto() {
        return userDataService
                .deleteProfilePhoto()
                .map(ignored -> new ResponseDTO<>(HttpStatus.OK.value(), null, null));
    }

    @GetMapping("/photo")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange) {
        return userDataService.makeProfilePhotoResponse(exchange)
                .switchIfEmpty(Mono.fromRunnable(() -> {
                    exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
                }));
    }

    @GetMapping("/photo/{email}")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange, @PathVariable String email) {
        return userDataService.makeProfilePhotoResponse(exchange, email)
                .switchIfEmpty(Mono.fromRunnable(() -> {
                    exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
                }));
    }

}
