package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.cakes.ConfigRepositoryCake;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Set;

import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;

@Component
@RequiredArgsConstructor
public class PermaCacheBeans {

    private final ConfigRepositoryCake configRepository;

    @Bean
    public Mono<Set<String>> anonymousUserPermissionGroups() {
        return configRepository
                .findByName(FieldName.PUBLIC_PERMISSION_GROUP)
                .map(c -> Set.of(c.getConfig().getAsString(PERMISSION_GROUP_ID)))
                .cache();
    }
}
