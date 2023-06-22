package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserApiKey;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApiKeyRepository;
import com.appsmith.server.repositories.UserRepository;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Component
public class ApiKeyServiceImpl extends BaseService<ApiKeyRepository, UserApiKey, String> implements ApiKeyService {

    private final TenantService tenantService;

    private final ApiKeyRepository userApiKeyRepository;
    private final UserRepository userRepository;

    public ApiKeyServiceImpl(MongoConverter mongoConverter,
                             Validator validator,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             Scheduler scheduler,
                             AnalyticsService analyticsService,
                             TenantService tenantService,
                             ApiKeyRepository repository,
                             UserRepository userRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.tenantService = tenantService;
        this.userApiKeyRepository = repository;
        this.userRepository = userRepository;
    }

    @Override
    public Mono<String> generateApiKey(ApiKeyRequestDto apiKeyRequestDto) {
        /*
         * We want to restrict the API Key generation to Users who are associated with Instance Administrator Role.
         * Fetching the tenant with MANAGE_TENANT permission assures that.
         */
        Mono<Tenant> tenantMono = tenantService.getDefaultTenant(AclPermission.MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "create API Keys")));
        Mono<User> userMono = tenantMono.then(userRepository.findByCaseInsensitiveEmail(apiKeyRequestDto.getEmail())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.USER_NOT_FOUND, apiKeyRequestDto.getEmail()))));
        return userMono
                .flatMap(user -> {
                    UserApiKey userApiKey = new UserApiKey();
                    userApiKey.setUserId(user.getId());
                    userApiKey.setApiKey(generateToken(user.getId()));
                    return userApiKeyRepository.save(userApiKey);
                })
                .map(UserApiKey::getApiKey);
    }

    private String generateToken(String userId) {
        String seedValue = userId + Instant.now().toString();
        SecureRandom secureRandom = new SecureRandom(seedValue.getBytes());
        byte[] bytes = new byte[124];
        secureRandom.nextBytes(bytes);
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        return encoder.encodeToString(bytes);
    }
}
