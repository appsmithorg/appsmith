package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UserSignupRequestDTO;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface UserSignupCE {

    /**
     * This function does the sign-up flow of the given user object as a new user, and then logs that user. After the
     * login is successful, the authentication success handlers will be called directly.
     * This needed to be pulled out into a separate solution class since it was creating a circular autowiring error if
     * placed inside UserService.
     * @param user User object representing the new user to be signed-up and then logged-in.
     * @param exchange ServerWebExchange object with details of the current web request.
     * @return Mono of User, published the saved user object with a non-null value for its `getId()`.
     */
    Mono<User> signupAndLogin(User user, ServerWebExchange exchange);

    /**
     * Creates a new user and logs them in, with the user details taken from the POST body, read as form-data.
     * @param exchange The `ServerWebExchange` instance representing the request.
     * @return Publisher of the created user object, with an `id` value.
     */
    Mono<Void> signupAndLoginFromFormData(ServerWebExchange exchange);

    Mono<User> signupAndLoginSuper(UserSignupRequestDTO userFromRequest, ServerWebExchange exchange);

    Mono<Void> signupAndLoginSuperFromFormData(ServerWebExchange exchange);

}
