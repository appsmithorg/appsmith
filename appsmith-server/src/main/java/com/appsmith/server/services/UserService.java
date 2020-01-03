package com.appsmith.server.services;

import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import reactor.core.publisher.Mono;

public interface UserService extends CrudService<User, String> {

    Mono<User> findByEmail(String email);

    Mono<User> switchCurrentOrganization(String orgId);

    Mono<User> addUserToOrganization(String orgId, User user);

    Mono<Boolean> forgotPasswordTokenGenerate(ResetUserPasswordDTO resetUserPasswordDTO);

    Mono<Boolean> verifyPasswordResetToken(String email, String token);

    Mono<Boolean> resetPasswordAfterForgotPassword(String token, User user);

    Mono<User> inviteUser(User user, String originHeader);

    Mono<Boolean> verifyInviteToken(String email, String token);

    Mono<Boolean> confirmInviteUser(InviteUser inviteUser);
}
