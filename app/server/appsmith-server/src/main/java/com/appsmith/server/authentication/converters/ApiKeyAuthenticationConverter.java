package com.appsmith.server.authentication.converters;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.authentication.tokens.ApiKeyAuthentication;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserApiKey;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApiKeyRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@AllArgsConstructor
public class ApiKeyAuthenticationConverter implements ServerAuthenticationConverter {
    private static final String APPSMITH_API_KEY_HEADER = "x-appsmith-key";

    private final UserRepository userRepository;
    private final ApiKeyRepository userApiKeyRepository;
    private final EncryptionService encryptionService;

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        return Mono.justOrEmpty(exchange)
                .flatMap(serverWebExchange -> Mono.justOrEmpty(
                        serverWebExchange.getRequest().getHeaders().get(APPSMITH_API_KEY_HEADER)))
                .filter(headerValues -> !headerValues.isEmpty())
                .map(headerValues -> headerValues.get(0))
                .flatMap(this::getAuthentication);
    }

    /**
     * Method will check whether the apiKey supplied is mapped to any valid user or not.
     * If the apiKey is incorrect or isn't mapped to any user, the method will set the Authentication Principal to
     * Anonymous User by default.
     * @param apiKey
     * @return
     */
    private Mono<Authentication> getAuthentication(String apiKey) {
        return Mono.defer(() -> {
                    UserApiKey userApiKey = getUserApiKey(apiKey);
                    Mono<User> userMono = userApiKeyRepository
                            .getByUserIdWithoutPermission(userApiKey.getUserId())
                            .filter(availableUserApiKey ->
                                    availableUserApiKey.getApiKey().equals(userApiKey.getApiKey()))
                            .collectList()
                            .flatMap(userApiKeys -> {
                                if (userApiKeys.isEmpty()) {
                                    return Mono.error(new AppsmithException(AppsmithError.API_KEY_NOT_MAPPED));
                                }
                                UserApiKey matchedUserApiKey = userApiKeys.get(0);
                                return userRepository.findById(matchedUserApiKey.getUserId());
                            });
                    return userMono;
                })
                .onErrorResume(error -> {
                    log.error(error.getMessage());
                    return userRepository.findByCaseInsensitiveEmail(FieldName.ANONYMOUS_USER);
                })
                .map(user -> new ApiKeyAuthentication(apiKey, user));
    }

    private UserApiKey getUserApiKey(String encryptedApiKey) {
        try {
            String decryptedApiKey = encryptionService.decryptString(encryptedApiKey);
            List<String> apiKeyAndUserId = Arrays.stream(decryptedApiKey.split(FieldName.APIKEY_USERID_DELIMITER))
                    .toList();
            if (apiKeyAndUserId.size() != 2) {
                throw new AppsmithException(AppsmithError.INVALID_API_KEY);
            }
            UserApiKey userApiKey = new UserApiKey();
            userApiKey.setApiKey(apiKeyAndUserId.get(0));
            userApiKey.setUserId(apiKeyAndUserId.get(1));
            return userApiKey;
        } catch (Exception exception) {
            throw new AppsmithException(AppsmithError.INVALID_API_KEY);
        }
    }
}
