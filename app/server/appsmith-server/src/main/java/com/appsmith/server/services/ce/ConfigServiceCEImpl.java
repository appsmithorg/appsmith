package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.BOOTSTRAP_COMPLETED;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_VARIABLES;

@Slf4j
public class ConfigServiceCEImpl implements ConfigServiceCE {
    private final ConfigRepository repository;
    private final UserRepository userRepository;

    // This is permanently cached through the life of the JVM process as this is not intended to change at runtime ever.
    private String instanceId = null;

    public ConfigServiceCEImpl(ConfigRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Override
    public Mono<Config> getByName(String name) {
        return repository
                .findByName(name)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)));
    }

    @Override
    public Mono<Config> save(Config config) {
        return repository
                .findByName(config.getName())
                .flatMap(dbConfig -> {
                    dbConfig.setConfig(config.getConfig());
                    return repository.save(dbConfig);
                })
                .switchIfEmpty(Mono.defer(() -> repository.save(config)));
    }

    @Override
    public Mono<Config> save(String name, Map<String, Object> config) {
        return save(new Config(new JSONObject(config), name));
    }

    @Override
    public Mono<String> getInstanceId() {
        if (instanceId != null) {
            return Mono.just(instanceId);
        }

        return getByName("instance-id").map(config -> {
            instanceId = config.getConfig().getAsString("value");
            return instanceId;
        });
    }

    @Override
    public Mono<Void> delete(String name) {
        return repository
                .findByName(name)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)))
                .flatMap(repository::delete);
    }

    @Override
    public Mono<Map<String, Object>> getInstanceVariables() {
        return getByName(FieldName.INSTANCE_CONFIG).map(config -> {
            Object instanceVariablesObj = config.getConfig().getOrDefault(INSTANCE_VARIABLES, new JSONObject());
            Map<String, Object> instanceVariables;

            if (instanceVariablesObj instanceof JSONObject) {
                instanceVariables = ((JSONObject) instanceVariablesObj);
            } else if (instanceVariablesObj instanceof Map) {
                instanceVariables = (Map<String, Object>) instanceVariablesObj;
            } else {
                instanceVariables = new JSONObject();
            }

            return instanceVariables;
        });
    }

    @Override
    public Mono<Config> updateInstanceVariables(Map<String, Object> instanceVariables) {
        // TODO @CloudBilling add manage instance permission once the migration for variables is complete
        return getByName(FieldName.INSTANCE_CONFIG).flatMap(config -> {
            JSONObject configObj = config.getConfig();
            configObj.put(INSTANCE_VARIABLES, instanceVariables);
            config.setConfig(configObj);
            return repository.save(config);
        });
    }

    @Override
    public Mono<Boolean> isBootstrapCompleted() {
        return getByName(FieldName.INSTANCE_CONFIG)
                .flatMap(instanceConfig -> {
                    JSONObject config = instanceConfig.getConfig();
                    Object flag = config.get(BOOTSTRAP_COMPLETED);
                    if (Boolean.TRUE.equals(flag)) {
                        return Mono.just(true);
                    }
                    // For upgraded instances that already have users but no durable flag,
                    // treat as bootstrap-completed and backfill the flag.
                    return userRepository.isUsersEmpty().flatMap(isEmpty -> {
                        if (Boolean.TRUE.equals(isEmpty)) {
                            return Mono.just(false);
                        }
                        // Users exist but flag is missing — backfill for upgraded instance
                        config.put(BOOTSTRAP_COMPLETED, true);
                        instanceConfig.setConfig(config);
                        return repository.save(instanceConfig).thenReturn(true);
                    });
                })
                .onErrorResume(AppsmithException.class, e -> {
                    // If instanceConfig doesn't exist yet (very early startup), not bootstrapped
                    return Mono.just(false);
                });
    }

    @Override
    public Mono<Config> markBootstrapCompleted() {
        return getByName(FieldName.INSTANCE_CONFIG).flatMap(instanceConfig -> {
            JSONObject config = instanceConfig.getConfig();
            config.put(BOOTSTRAP_COMPLETED, true);
            instanceConfig.setConfig(config);
            return repository.save(instanceConfig);
        });
    }
}
