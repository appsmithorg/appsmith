package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.pf4j.util.StringUtils;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Protocol;
import redis.clients.jedis.exceptions.JedisConnectionException;
import redis.clients.jedis.util.SafeEncoder;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class RedisPlugin extends BasePlugin {
    private static final Integer DEFAULT_PORT = 6379;

    public RedisPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RedisPluginExecutor implements PluginExecutor<Jedis> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(Jedis jedis,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {
            return (Mono<ActionExecutionResult>) Mono.fromCallable(() -> {
                String body = actionConfiguration.getBody();
                if (StringUtils.isNullOrEmpty(body)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                            String.format("Body is null or empty [%s]", body)));
                }

                // First value will be the redis command and others are arguments for that command
                String[] bodySplitted = body.trim().split("\\s+");

                Protocol.Command command;
                try {
                    // Commands are in upper case
                    command = Protocol.Command.valueOf(bodySplitted[0].toUpperCase());
                } catch (IllegalArgumentException exc) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                            String.format("Not a valid Redis command:%s", bodySplitted[0])));
                }

                Object commandOutput;
                if (bodySplitted.length > 1) {
                    commandOutput = jedis.sendCommand(command, Arrays.copyOfRange(bodySplitted, 1, bodySplitted.length));
                } else {
                    commandOutput = jedis.sendCommand(command);
                }

                ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                actionExecutionResult.setBody(objectMapper.valueToTree(processCommandOutput(commandOutput)));
                actionExecutionResult.setIsExecutionSuccess(true);

                System.out.println(Thread.currentThread().getName() + ": In the RedisPlugin, got action execution result: " + actionExecutionResult.toString());
                return Mono.just(actionExecutionResult);
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        // This will be updated as we encounter different outputs.
        private List<Map<String, String>> processCommandOutput(Object commandOutput) {
            if (commandOutput == null) {
                return List.of(Map.of("result", "null"));
            } else if (commandOutput instanceof byte[]) {
                return List.of(Map.of("result", SafeEncoder.encode((byte[]) commandOutput)));
            } else if (commandOutput instanceof List) {
                List<byte[]> commandList = (List<byte[]>) commandOutput;
                return commandList.stream()
                        .map(obj -> Map.of("result", SafeEncoder.encode(obj)))
                        .collect(Collectors.toList());
            } else {
                return List.of(Map.of("result", String.valueOf(commandOutput)));
            }
        }

        @Override
        public Mono<Jedis> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return (Mono<Jedis>) Mono.fromCallable(() -> {
                if (datasourceConfiguration.getEndpoints().isEmpty()) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "No endpoint(s) configured"));
                }

                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                Integer port = (int) (long) ObjectUtils.defaultIfNull(endpoint.getPort(), DEFAULT_PORT);
                Jedis jedis = new Jedis(endpoint.getHost(), port);

                AuthenticationDTO auth = datasourceConfiguration.getAuthentication();
                if (auth != null && AuthenticationDTO.Type.USERNAME_PASSWORD.equals(auth.getAuthType())) {
                    jedis.auth(auth.getUsername(), auth.getPassword());
                }

                return Mono.just(jedis);
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(Jedis jedis) {
            // Schedule on elastic thread pool and subscribe immediately.
            Mono.fromSupplier(() -> {
                try {
                    if (jedis != null) {
                        jedis.close();
                    }
                } catch (JedisConnectionException exc) {
                    System.out.println("Error closing Redis connection");
                }

                return Mono.empty();
            })
                    .subscribeOn(scheduler)
                    .subscribe();
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("Missing endpoint(s)");
            } else {
                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                if (StringUtils.isNullOrEmpty(endpoint.getHost())) {
                    invalids.add("Missing host for endpoint");
                }
                if (endpoint.getPort() == null) {
                    invalids.add("Missing port for endpoint");
                }
            }

            AuthenticationDTO auth = datasourceConfiguration.getAuthentication();
            if (auth != null && AuthenticationDTO.Type.USERNAME_PASSWORD.equals(auth.getAuthType())) {
                if (StringUtils.isNullOrEmpty(datasourceConfiguration.getAuthentication().getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isNullOrEmpty(datasourceConfiguration.getAuthentication().getPassword())) {
                    invalids.add("Missing password for authentication.");
                }
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
                return Mono.error(new RuntimeException(
                        String.format("Expected PONG in response of PING but got %s", pingResponse)));
            }

            return Mono.empty();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {

            return Mono.fromCallable(() ->
                    datasourceCreate(datasourceConfiguration)
                    .map(jedis -> {
                        verifyPing(jedis).block();
                        datasourceDestroy(jedis);
                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage()))))
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

    }
}
