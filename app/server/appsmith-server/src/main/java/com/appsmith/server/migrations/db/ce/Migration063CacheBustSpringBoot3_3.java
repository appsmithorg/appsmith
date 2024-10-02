package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.script.RedisScript;
import reactor.core.publisher.Flux;

@RequiredArgsConstructor
@Slf4j
@ChangeUnit(order = "063", id = "reset_session_oauth2_spring_3_3")
public class Migration063CacheBustSpringBoot3_3 {

    private final ReactiveRedisOperations<String, String> reactiveRedisOperations;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        doClearRedisOAuth2AuthClientKeys(reactiveRedisOperations);
    }

    public static void doClearRedisOAuth2AuthClientKeys(
            ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        final String authorizedClientsKey =
                "sessionAttr:org.springframework.security.oauth2.client.web.server.WebSessionServerOAuth2AuthorizedClientRepository.AUTHORIZED_CLIENTS";
        final String script =
                "for _,k in ipairs(redis.call('keys','spring:session:sessions:*')) do local fieldExists = redis.call('hexists', k, '"
                        + authorizedClientsKey + "'); if fieldExists == 1 then redis.call('del', k) end end";
        final Flux<Object> flushdb = reactiveRedisOperations.execute(RedisScript.of(script));

        flushdb.blockLast();
    }
}
