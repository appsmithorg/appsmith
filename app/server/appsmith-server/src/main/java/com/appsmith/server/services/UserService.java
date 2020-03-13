package com.appsmith.server.services;

import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import org.springframework.security.core.GrantedAuthority;
import reactor.core.publisher.Mono;

import java.util.Collection;

public interface UserService extends CrudService<User, String> {

    Mono<User> findByEmail(String email);

    Mono<User> switchCurrentOrganization(String orgId);

    Mono<Boolean> forgotPasswordTokenGenerate(ResetUserPasswordDTO resetUserPasswordDTO);

    Mono<Boolean> verifyPasswordResetToken(String email, String token);

    Mono<Boolean> resetPasswordAfterForgotPassword(String token, User user);

    Mono<User> inviteUser(User user, String originHeader);

    Mono<Boolean> verifyInviteToken(String email, String token);

    Mono<Boolean> confirmInviteUser(InviteUser inviteUser, String originHeader);

    Mono<Collection<GrantedAuthority>> getAnonymousAuthorities();

    Mono<UserProfileDTO> getUserProfile();

    Mono<User> createUser(User user, String originHeader);
}
