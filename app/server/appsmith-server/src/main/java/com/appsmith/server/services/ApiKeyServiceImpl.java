package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
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

    private final UserRepository userRepository;

    private final EncryptionService encryptionService;

    public ApiKeyServiceImpl(
            MongoConverter mongoConverter,
            Validator validator,
            ReactiveMongoTemplate reactiveMongoTemplate,
            Scheduler scheduler,
            AnalyticsService analyticsService,
            TenantService tenantService,
            ApiKeyRepository repository,
            UserRepository userRepository,
            EncryptionService encryptionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.tenantService = tenantService;
        this.userRepository = userRepository;
        this.encryptionService = encryptionService;
    }

    @Override
    public Mono<String> generateApiKey(ApiKeyRequestDto apiKeyRequestDto) {
        /*
         * We want to restrict the API Key generation to Users who are associated with Instance Administrator Role.
         * Fetching the tenant with MANAGE_TENANT permission assures that.
         */
        Mono<Tenant> tenantMono = tenantService
                .getDefaultTenant(AclPermission.MANAGE_TENANT)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "create API Keys")))
                .cache();
        return tenantMono.then(generateApiKeyWithoutPermissionCheck(apiKeyRequestDto));
    }

    @Override
    public Mono<String> generateApiKeyWithoutPermissionCheck(ApiKeyRequestDto apiKeyRequestDto) {
        Mono<User> userMono = userRepository
                .findByCaseInsensitiveEmail(apiKeyRequestDto.getEmail())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.USER_NOT_FOUND, apiKeyRequestDto.getEmail())));

        return userMono.flatMap(user -> {
                    String generatedToken = generateToken(user.getId());
                    UserApiKey userApiKey = new UserApiKey();
                    userApiKey.setUserId(user.getId());
                    userApiKey.setApiKey(generatedToken);
                    // Generated token is encrypted and stored in DB.
                    // Generated token is concatenated with UserId and returned.
                    return repository
                            .save(userApiKey)
                            .thenReturn(concatenateKeyAndUserId(generatedToken, user.getId()));
                })
                // Encrypt the concatenatedKeyAndUserId and then return it.
                .map(encryptionService::encryptString);
    }

    @Override
    public Mono<Boolean> archiveAllApiKeysForUser(String email) {
        /*
         * We want to restrict the API Key archive to Users who are associated with Instance Administrator Role.
         * Fetching the tenant with MANAGE_TENANT permission assures that.
         */
        Mono<Tenant> tenantMono = tenantService
                .getDefaultTenant(AclPermission.MANAGE_TENANT)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "delete API Keys")));
        return tenantMono.then(archiveAllApiKeysForUserWithoutPermissionCheck(email));
    }

    /**
     * This method archive API keys for email without checking if current user has permission to perform archive
     * @param email - user email
     * @return archive result
     */
    @Override
    public Mono<Boolean> archiveAllApiKeysForUserWithoutPermissionCheck(String email) {
        Mono<User> userMono = userRepository
                .findByCaseInsensitiveEmail(email)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.USER_NOT_FOUND, email)));

        // Archive all API Keys which exist for the User.
        return userMono.flatMapMany(user -> repository.getByUserIdWithoutPermission(user.getId()))
                .flatMap(userApiKey -> repository.archiveById(userApiKey.getId()))
                .collectList()
                .thenReturn(Boolean.TRUE);
    }

    public static String generateToken(String userId) {
        String seedValue = userId + Instant.now().toString();
        SecureRandom secureRandom = new SecureRandom(seedValue.getBytes());
        byte[] bytes = new byte[124];
        secureRandom.nextBytes(bytes);
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        return encoder.encodeToString(bytes);
    }

    private String concatenateKeyAndUserId(String apiKey, String userId) {
        return apiKey + FieldName.APIKEY_USERID_DELIMITER + userId;
    }
}
