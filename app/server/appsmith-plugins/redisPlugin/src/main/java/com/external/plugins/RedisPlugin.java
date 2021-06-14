package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
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
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import redis.clients.jedis.Protocol;
import redis.clients.jedis.exceptions.JedisException;
import redis.clients.jedis.util.SafeEncoder;

import java.time.Duration;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;

public class RedisPlugin extends BasePlugin {
    private static final Long DEFAULT_PORT = 6379L;
    private static final int CONNECTION_TIMEOUT = 60;

    public RedisPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RedisPluginExecutor implements PluginExecutor<JedisPool> {

        private final Scheduler scheduler = Schedulers.elastic();

        @Override
        public Mono<ActionExecutionResult> execute(JedisPool jedisPool,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            String query = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,  query, null
                    , null, null));

            Jedis jedis = jedisPool.getResource();
            return Mono.fromCallable(() -> {
                if (StringUtils.isNullOrEmpty(query)) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            String.format("Body is null or empty [%s]", query)));
                }

                // First value will be the redis command and others are arguments for that command
                String[] bodySplitted = query.trim().split("\\s+");

                Protocol.Command command;
                try {
                    // Commands are in upper case
                    command = Protocol.Command.valueOf(bodySplitted[0].toUpperCase());
                } catch (IllegalArgumentException exc) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
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

                System.out.println(Thread.currentThread().getName() + ": In the RedisPlugin, got action execution result");
                return Mono.just(actionExecutionResult);
            })
                    .flatMap(obj -> obj)
                    .map(obj -> (ActionExecutionResult) obj)
                    .onErrorResume(error  -> {
                        error.printStackTrace();
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned back to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        request.setRequestParams(requestParams);
                        ActionExecutionResult result = actionExecutionResult;
                        result.setRequest(request);
                        return result;
                    })
                    .doFinally(signalType -> {
                        /**
                         * - Return resource back to the pool.
                         * - https://stackoverflow.com/questions/54902337/is-it-necessary-to-use-jedis-close
                         * - https://www.baeldung.com/jedis-java-redis-client-library:
                         */
                        if (jedis != null) {
                            jedis.close();
                        }
                    })
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


        /**
         * - Config taken from https://www.baeldung.com/jedis-java-redis-client-library
         * - To understand what these config mean:
         * https://www.infoworld.com/article/2071834/pool-resources-using-apache-s-commons-pool-framework.html
         */
        private JedisPoolConfig buildPoolConfig() {
            final JedisPoolConfig poolConfig = new JedisPoolConfig();
            poolConfig.setMaxTotal(5);
            poolConfig.setMaxIdle(5);
            poolConfig.setMinIdle(0);
            poolConfig.setTestOnBorrow(true);
            poolConfig.setTestOnReturn(true);
            poolConfig.setTestWhileIdle(true);
            poolConfig.setMinEvictableIdleTimeMillis(Duration.ofSeconds(60).toMillis());
            poolConfig.setTimeBetweenEvictionRunsMillis(Duration.ofSeconds(30).toMillis());
            poolConfig.setNumTestsPerEvictionRun(3);
            poolConfig.setBlockWhenExhausted(true);
            return poolConfig;
        }

        @Override
        public Mono<JedisPool> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            return (Mono<JedisPool>) Mono.fromCallable(() -> {
                if (datasourceConfiguration.getEndpoints().isEmpty()) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, "No endpoint(s) " +
                            "configured"));
                }

                Endpoint endpoint = datasourceConfiguration.getEndpoints().get(0);
                Integer port = (int) (long) ObjectUtils.defaultIfNull(endpoint.getPort(), DEFAULT_PORT);
                final JedisPoolConfig poolConfig = buildPoolConfig();
                DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
                int timeout = (int)Duration.ofSeconds(CONNECTION_TIMEOUT).toMillis();
                JedisPool jedisPool;
                if (auth != null && StringUtils.isNotNullOrEmpty(auth.getPassword())) {
                    if (StringUtils.isNullOrEmpty(auth.getUsername())) {
                        // If username is empty, then authenticate with password only.
                         jedisPool = new JedisPool(poolConfig, endpoint.getHost(), port, timeout, auth.getPassword());
                    }
                    else {
                        jedisPool = new JedisPool(poolConfig, endpoint.getHost(), port, timeout,
                                auth.getUsername(), auth.getPassword());
                    }
                }
                else {
                    jedisPool = new JedisPool(poolConfig, endpoint.getHost(), port);
                }

                return Mono.just(jedisPool);
            })
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(JedisPool jedisPool) {
            // Schedule on elastic thread pool and subscribe immediately.
            Mono.fromSupplier(() -> {
                try {
                    if (jedisPool != null) {
                        jedisPool.destroy();
                    }
                } catch (JedisException e) {
                    System.out.println("Error destroying Jedis pool.");
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
            }

            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
            if (auth != null && DBAuth.Type.USERNAME_PASSWORD.equals(auth.getAuthType())) {
                if (StringUtils.isNullOrEmpty(auth.getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isNullOrEmpty(auth.getPassword())) {
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
                    .map(jedisPool -> {
                        Jedis jedis = jedisPool.getResource();
                        verifyPing(jedis).block();
                        datasourceDestroy(jedisPool);
                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage()))))
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

    }
}
