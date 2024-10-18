package com.appsmith.server.extensions;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.context.ApplicationContext;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static com.appsmith.server.testhelpers.cleanup.DBCleanup.deleteKeysWithPattern;

/**
 * This SpringExtension is used to clean up the database after all tests have run. It drops all tables and routines.
 * <br>
 * Annotate it in your test class to ensure database cleanup after all tests have run and doesn't affect state of other tests.
 * Use it in conjunction with @DirtiesContext
 * <br>
 * Example:
 * <br>
 * @ExtendWith(AfterAllCleanUpExtension.class)
 */
@Slf4j
public class AfterAllCleanUpExtension implements AfterAllCallback {
    @Override
    public void afterAll(ExtensionContext context) {
        Class<?> testClass = context.getRequiredTestClass();
        ApplicationContext applicationContext = SpringExtension.getApplicationContext(context);
        Flyway flyway = applicationContext.getBean(Flyway.class);
        ReactiveRedisTemplate<String, Object> reactiveRedisTemplate =
                applicationContext.getBean("reactiveRedisTemplate", ReactiveRedisTemplate.class);

        log.debug("Cleaning up after all tests for {}", testClass.getName());
        flyway.clean();
        flyway.migrate();
        deleteKeysWithPattern("tenant:.*", reactiveRedisTemplate).block();
    }
}
