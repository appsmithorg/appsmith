package com.appsmith.server.services;

import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import reactor.core.publisher.Mono;

import java.util.List;

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

}
