package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ConfigRepository;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_VARIABLES;

@Slf4j
public class ConfigServiceCEImpl implements ConfigServiceCE {
    private final ConfigRepository repository;

    // This is permanently cached through the life of the JVM process as this is not intended to change at runtime ever.
    private String instanceId = null;

    public ConfigServiceCEImpl(ConfigRepository repository) {
        this.repository = repository;
    }

    @Override
    public Mono<Config> getByName(String name) {
        return repository
                .findByName(name)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)));
    }

    @Override
    public Mono<Config> updateByName(Config config) {
        final String name = config.getName();
        return repository
                .findByName(name)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)))
                .flatMap(dbConfig -> {
                    log.debug("Found config with name: {} and id: {}", name, dbConfig.getId());
                    dbConfig.setConfig(config.getConfig());
                    return repository.save(dbConfig);
                });
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
    public Mono<Config> getByName(String name, AclPermission permission) {
        return repository.findByName(name, permission);
    }

    @Override
    public Mono<Config> getByNameAsUser(String name, User user, AclPermission permission) {
        return repository.findByNameAsUser(name, user, permission);
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
    public Mono<Config> updateInstanceVariables(JSONObject instanceVariables) {
        return getByName(FieldName.INSTANCE_CONFIG, AclPermission.MANAGE_INSTANCE_CONFIGURATION)
                .flatMap(config -> {
                    JSONObject configObj = config.getConfig();
                    configObj.put(INSTANCE_VARIABLES, instanceVariables);
                    config.setConfig(configObj);
                    return repository.save(config);
                });
    }
}
