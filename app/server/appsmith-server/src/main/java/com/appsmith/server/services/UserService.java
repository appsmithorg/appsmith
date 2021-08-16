package com.appsmith.server.services;

import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface UserService extends CrudService<User, String> {

    Mono<User> findByEmail(String email);

    Mono<User> switchCurrentOrganization(String orgId);

    Mono<Boolean> forgotPasswordTokenGenerate(ResetUserPasswordDTO resetUserPasswordDTO);

    Mono<Boolean> verifyPasswordResetToken(String email, String token);

    Mono<Boolean> resetPasswordAfterForgotPassword(String token, User user);

    Mono<User> inviteUserToApplication(InviteUser inviteUser, String originHeader, String applicationId);

    Mono<User> createUserAndSendEmail(User user, String originHeader);

    Mono<User> userCreate(User user);

    Mono<List<User>> inviteUsers(InviteUsersDTO inviteUsersDTO, String originHeader);

    Mono<User> updateCurrentUser(User updates, ServerWebExchange exchange);

    Map<String, String> getEmailParams(Organization organization, User inviterUser, String inviteUrl, boolean isNewUser);

    Mono<Boolean> isUsersEmpty();

    Mono<UserProfileDTO> buildUserProfileDTO(User user);
}
