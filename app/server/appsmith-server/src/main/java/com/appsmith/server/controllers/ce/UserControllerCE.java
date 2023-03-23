package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserSignupRequestDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.UserSignup;
import jakarta.validation.Valid;
import com.fasterxml.jackson.annotation.JsonView;

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
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;


@RequestMapping(Url.USER_URL)
@Slf4j
public class UserControllerCE extends BaseController<UserService, User, String> {

    private final SessionUserService sessionUserService;
    private final UserWorkspaceService userWorkspaceService;
    private final UserSignup userSignup;
    private final UserDataService userDataService;
    private final UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    public UserControllerCE(UserService service,
                            SessionUserService sessionUserService,
                            UserWorkspaceService userWorkspaceService,
                            UserSignup userSignup,
                            UserDataService userDataService,
                            UserAndAccessManagementService userAndAccessManagementService) {
        super(service);
        this.sessionUserService = sessionUserService;
        this.userWorkspaceService = userWorkspaceService;
        this.userSignup = userSignup;
        this.userDataService = userDataService;
        this.userAndAccessManagementService = userAndAccessManagementService;
    }

    @JsonView(Views.Public.class)
    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE})
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<User>> create(@Valid @RequestBody User resource,
                                          @RequestHeader(name = "Origin", required = false) String originHeader,
                                          ServerWebExchange exchange) {
        return userSignup.signupAndLogin(resource, exchange)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Void> createFormEncoded(ServerWebExchange exchange) {
        return userSignup.signupAndLoginFromFormData(exchange);
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/super", consumes = {MediaType.APPLICATION_JSON_VALUE})
    public Mono<ResponseDTO<User>> createSuperUser(
            @Valid @RequestBody UserSignupRequestDTO resource,
            ServerWebExchange exchange
    ) {
        return userSignup.signupAndLoginSuper(resource, exchange)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/super", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public Mono<Void> createSuperUserFromFormData(ServerWebExchange exchange) {
        return userSignup.signupAndLoginSuperFromFormData(exchange);
    }

    @JsonView(Views.Public.class)
    @PutMapping()
    public Mono<ResponseDTO<User>> update(@RequestBody UserUpdateDTO updates, ServerWebExchange exchange) {
        return service.updateCurrentUser(updates, exchange)
                .map(updatedUser -> new ResponseDTO<>(HttpStatus.OK.value(), updatedUser, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/leaveWorkspace/{workspaceId}")
    public Mono<ResponseDTO<User>> leaveWorkspace(@PathVariable String workspaceId) {
        return userWorkspaceService.leaveWorkspace(workspaceId)
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
    @JsonView(Views.Public.class)
    @PostMapping("/forgotPassword")
    public Mono<ResponseDTO<Boolean>> forgotPasswordRequest(@RequestBody ResetUserPasswordDTO userPasswordDTO,
                                                            @RequestHeader("Origin") String originHeader) {
        userPasswordDTO.setBaseUrl(originHeader);
        // We shouldn't leak information on whether this operation was successful or not to the client. This can enable
        // username scraping, where the response of this API can prove whether an email has an account or not.
        return service.forgotPasswordTokenGenerate(userPasswordDTO)
                .defaultIfEmpty(true)
                .onErrorReturn(true)
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), true, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/verifyPasswordResetToken")
    public Mono<ResponseDTO<Boolean>> verifyPasswordResetToken(@RequestParam String token) {
        return service.verifyPasswordResetToken(token)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/resetPassword")
    public Mono<ResponseDTO<Boolean>> resetPasswordAfterForgotPassword(@RequestBody ResetUserPasswordDTO userPasswordDTO) {
        return service.resetPasswordAfterForgotPassword(userPasswordDTO.getToken(), userPasswordDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/me")
    public Mono<ResponseDTO<UserProfileDTO>> getUserProfile() {
        return sessionUserService.getCurrentUser()
                .flatMap(service::buildUserProfileDTO)
                .map(profile -> new ResponseDTO<>(HttpStatus.OK.value(), profile, null));
    }

    /**
     * This function creates an invite for new users to join an Appsmith workspace. We require the Origin header
     * in order to construct client facing URLs that will be sent to the users via email.
     *
     * @param inviteUsersDTO The inviteUserDto object for the new users being invited to the Appsmith workspace
     * @param originHeader   Origin header in the request
     * @return List of new users who have been created/existing users who have been added to the workspace.
     */
    @JsonView(Views.Public.class)
    @PostMapping("/invite")
    public Mono<ResponseDTO<List<User>>> inviteUsers(@RequestBody InviteUsersDTO inviteUsersDTO,
                                                     @RequestHeader("Origin") String originHeader) {
        return userAndAccessManagementService.inviteUsers(inviteUsersDTO, originHeader)
                .map(users -> new ResponseDTO<>(HttpStatus.OK.value(), users, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/setReleaseNotesViewed")
    public Mono<ResponseDTO<Void>> setReleaseNotesViewed() {
        return sessionUserService.getCurrentUser()
                .flatMap(userDataService::setViewedCurrentVersionReleaseNotes)
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), null, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<UserData>> uploadProfilePhoto(@RequestPart("file") Mono<Part> fileMono) {
        return fileMono
                .flatMap(userDataService::saveProfilePhoto)
                .map(url -> new ResponseDTO<>(HttpStatus.OK.value(), url, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/photo")
    public Mono<ResponseDTO<Void>> deleteProfilePhoto() {
        return userDataService
                .deleteProfilePhoto()
                .map(ignored -> new ResponseDTO<>(HttpStatus.OK.value(), null, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/photo")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange) {
        return userDataService.makeProfilePhotoResponse(exchange)
                .switchIfEmpty(Mono.fromRunnable(() -> {
                    exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
                }));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/photo/{email}")
    public Mono<Void> getProfilePhoto(ServerWebExchange exchange, @PathVariable String email) {
        return userDataService.makeProfilePhotoResponse(exchange, email)
                .switchIfEmpty(Mono.fromRunnable(() -> {
                    exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
                }));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/features")
    public Mono<ResponseDTO<Map<String, Boolean>>> getFeatureFlags() {
        return userDataService.getFeatureFlagsForCurrentUser()
                .map(map -> new ResponseDTO<>(HttpStatus.OK.value(), map, null));
    }
}
