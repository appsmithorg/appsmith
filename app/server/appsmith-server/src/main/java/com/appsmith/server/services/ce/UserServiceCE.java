package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResendEmailVerificationDTO;
import com.appsmith.server.dtos.ResetUserPasswordDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.services.CrudService;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface UserServiceCE extends CrudService<User, String> {

    Mono<User> findByEmail(String email);

    Mono<User> findByEmailAndTenantId(String email, String tenantId);

    Mono<Boolean> forgotPasswordTokenGenerate(ResetUserPasswordDTO resetUserPasswordDTO);

    Mono<Boolean> verifyPasswordResetToken(String token);

    Mono<Boolean> resetPasswordAfterForgotPassword(String token, User user);

    Mono<UserSignupDTO> createUser(User user);

    Mono<User> userCreate(User user, boolean isAdminUser);

    Mono<Integer> updateWithoutPermission(String id, BridgeUpdate updateObj);

    Mono<User> updateCurrentUser(UserUpdateDTO updates, ServerWebExchange exchange);

    Mono<Boolean> isUsersEmpty();

    Mono<UserProfileDTO> buildUserProfileDTO(User user);

    Flux<User> getAllByEmails(Set<String> emails, AclPermission permission);

    Mono<User> signupIfAllowed(User user);

    Mono<User> updateWithoutPermission(String id, User update);

    Mono<Boolean> resendEmailVerification(ResendEmailVerificationDTO resendEmailVerificationDTO, String redirectUrl);

    Mono<Void> verifyEmailVerificationToken(ServerWebExchange exchange);
}
