package com.external.plugins;

import com.appsmith.external.models.*;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.pf4j.util.StringUtils;
import reactor.core.publisher.Mono;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Protocol;
import redis.clients.jedis.exceptions.JedisConnectionException;

import java.util.HashSet;
import java.util.Set;

public class RedisPlugin extends BasePlugin {
    private static final Integer DEFAULT_PORT = 6379;

    public RedisPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RedisPluginExecutor implements PluginExecutor<Jedis> {
        @Override
        public Mono<ActionExecutionResult> execute(Jedis jedis,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            String body = actionConfiguration.getBody().trim();
            if (StringUtils.isNullOrEmpty(body)) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        String.format("Body is null or empty [%s]", body)));
            }

            String[] bodySplitted = body.split("\\s+");
            Protocol.Command command;
            try {
                command = Protocol.Command.valueOf(bodySplitted[0]);
            } catch (IllegalArgumentException exc) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        String.format("Not a valid Redis command:%s", bodySplitted[0])));
            }

            Object commandOutput;
            if (bodySplitted.length > 1) {
                String args[] = new String[bodySplitted.length - 1];
                System.arraycopy(bodySplitted, 1, args, 0, bodySplitted.length - 1);
                commandOutput = jedis.sendCommand(command, args);
            } else {
                commandOutput = jedis.sendCommand(command);
            }

            ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
            actionExecutionResult.setBody(String.valueOf(commandOutput));
            return Mono.just(actionExecutionResult);
        }

        @Override
        public Mono<Jedis> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            if (datasourceConfiguration.getEndpoints().isEmpty()) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "No endpoint(s) configured"));
            }

            Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
            Integer port = (Integer) ObjectUtils.defaultIfNull(endpoint.getPort(), DEFAULT_PORT);
            Jedis jedis = new Jedis(endpoint.getHost(), port);

            AuthenticationDTO auth = datasourceConfiguration.getAuthentication();
            if (auth != null && AuthenticationDTO.Type.USERNAME_PASSWORD.equals(auth.getAuthType())) {
                jedis.auth(auth.getUsername(), auth.getPassword());
            }

            return Mono.just(new Jedis(endpoint.getHost(), port));
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

            if (datasourceConfiguration.getEndpoints().size() == 1) {
                invalids.add(String.format("Should have 1 endpoint found [%s]", datasourceConfiguration.getEndpoints().size()));
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

    }
}
