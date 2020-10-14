package com.external.plugins;

import com.appsmith.external.models.*;
import com.appsmith.external.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Protocol;
import redis.clients.jedis.exceptions.JedisConnectionException;

import java.util.HashSet;
import java.util.Set;

public class RedisPlugin extends BasePlugin {
    public RedisPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RedisPluginExecutor implements PluginExecutor<Jedis> {
        @Override
        public Mono<ActionExecutionResult> execute(Jedis jedis, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            return null;
        }

        @Override
        public Mono<Jedis> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public void datasourceDestroy(Jedis jedis) {
            try {
                if (jedis != null) {
                    jedis.close();
                }
            } catch (JedisConnectionException exc) {
                log.error("Error closing Redis connection");
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("Missing endpoint(s)");
            }

            return invalids;
        }

        private Mono<Void> verifyPing(Jedis jedis) {
            String pingResponse;
            try {
                pingResponse = jedis.ping();
            } catch (Exception exc) {
                return Mono.error(exc);
            }

            if (!"PONG".equals(pingResponse)) {
                return Mono.error(new RuntimeException(String.format("Expected PONG in response of PING but got %s", pingResponse)));
            }

            return Mono.empty();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration).
                    map(jedis -> {
                        verifyPing(jedis).block();
                        return new DatasourceTestResult();
                    }).
                    onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())));
        }


        @Override
        public Mono<DatasourceStructure> getStructure(Jedis jedis, DatasourceConfiguration datasourceConfiguration) {
            verifyPing(jedis).doOnError(error -> {
                throw new StaleConnectionException(error.getMessage());
            }).block();

            jedis.sendCommand(Protocol.Command.INFO, "keyspace");
            return Mono.empty();
        }
    }
}
