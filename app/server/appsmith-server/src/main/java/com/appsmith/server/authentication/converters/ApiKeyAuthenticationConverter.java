package com.appsmith.server.authentication.converters;

import com.appsmith.server.authentication.tokens.ApiKeyAuthentication;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exceptions.InValidApiKeyException;
import com.appsmith.server.repositories.ApiKeyRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@AllArgsConstructor
public class ApiKeyAuthenticationConverter implements ServerAuthenticationConverter {
    private static final String APPSMITH_API_KEY_HEADER = "x-appsmith-key";

    private final UserRepository userRepository;
    private final ApiKeyRepository userApiKeyRepository;

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        return Mono.justOrEmpty(exchange)
                .flatMap(serverWebExchange -> Mono.justOrEmpty(serverWebExchange.getRequest().getHeaders().get(APPSMITH_API_KEY_HEADER)))
                .filter(headerValues -> ! headerValues.isEmpty())
                .map(headerValues -> headerValues.get(0))
                .flatMap(this::getAuthentication);
    }

    private Mono<Authentication> getAuthentication(String apiKey) {
        Mono<User> userMono = userApiKeyRepository.findByApiKey(apiKey)
                .flatMap(userApiKey -> userRepository.retrieveById(userApiKey.getUserId()))
                .switchIfEmpty(Mono.error(new InValidApiKeyException(AppsmithError.INVALID_API_KEY.getTitle(), new AppsmithException(AppsmithError.INVALID_API_KEY))));
        return userMono.map(user -> new ApiKeyAuthentication(apiKey, user));
    }
}
