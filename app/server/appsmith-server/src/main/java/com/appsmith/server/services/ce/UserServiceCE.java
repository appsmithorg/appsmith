package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.services.CrudService;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

public interface UserServiceCE extends CrudService<User, String> {

    Mono<User> findByEmail(String email);

    Mono<User> findByEmailAndTenantId(String email, String tenantId);

    Mono<User> switchCurrentWorkspace(String workspaceId);

    Mono<Boolean> forgotPasswordTokenGenerate(ResetUserPasswordDTO resetUserPasswordDTO);

    Mono<Boolean> verifyPasswordResetToken(String token);

    Mono<Boolean> resetPasswordAfterForgotPassword(String token, User user);

    Mono<UserSignupDTO> createUserAndSendEmail(User user, String originHeader);

    Mono<User> userCreate(User user, boolean isAdminUser);

    Mono<? extends User> createNewUserAndSendInviteEmail(String email, String originHeader,
                                                         Workspace workspace, User inviter, String role);

    Mono<User> updateCurrentUser(UserUpdateDTO updates, ServerWebExchange exchange);

    Map<String, String> getEmailParams(Workspace workspace, User inviterUser, String inviteUrl, boolean isNewUser);

    Mono<Boolean> isUsersEmpty();

    Mono<UserProfileDTO> buildUserProfileDTO(User user);

    Flux<User> getAllByEmails(Set<String> emails, AclPermission permission);

    Mono<Map<String, String>> updateTenantLogoInParams(Map<String, String> params);
}
