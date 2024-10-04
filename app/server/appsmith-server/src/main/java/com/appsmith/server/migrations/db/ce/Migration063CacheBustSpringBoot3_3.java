package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

@RequiredArgsConstructor
@Slf4j
@ChangeUnit(order = "063", id = "reset_session_oauth2_spring_3_3")
public class Migration063CacheBustSpringBoot3_3 {

    private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void execute() {
        reactiveRedisTemplate
                .getConnectionFactory()
                .getReactiveConnection()
                .serverCommands()
                .flushDb()
                .block();
    }
}
