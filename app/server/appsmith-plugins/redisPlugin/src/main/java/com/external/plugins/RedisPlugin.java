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
import com.external.plugins.exceptions.RedisErrorMessages;
import com.external.plugins.exceptions.RedisPluginError;
import com.external.utils.RedisURIUtils;
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

import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
public class RedisPlugin extends BasePlugin {
    private static final int CONNECTION_TIMEOUT = 60;
    private static final String CMD_KEY = "cmd";
    private static final String ARGS_KEY = "args";

    public RedisPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class RedisPluginExecutor implements PluginExecutor<JedisPool> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(
                JedisPool jedisPool,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            log.debug(Thread.currentThread().getName() + ": execute() called for Redis plugin.");
            String query = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams =
                    List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null, null, null));

            Jedis jedis;
            try {
                jedis = jedisPool.getResource();
            } catch (Exception e) {
                return Mono.error(new AppsmithPluginException(
                        RedisPluginError.QUERY_EXECUTION_FAILED,
                        RedisErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                        e.getMessage()));
            }
            return Mono.fromCallable(() -> {
                        if (StringUtils.isNullOrEmpty(query)) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    String.format(RedisErrorMessages.BODY_IS_NULL_OR_EMPTY_ERROR_MSG, query)));
                        }

                        Map cmdAndArgs = getCommandAndArgs(query.trim());
                        if (!cmdAndArgs.containsKey(CMD_KEY)) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    RedisErrorMessages.QUERY_PARSING_FAILED_ERROR_MSG));
                        }

                        Protocol.Command command;
                        try {
                            // Commands are in upper case
                            command = Protocol.Command.valueOf((String) cmdAndArgs.get(CMD_KEY));
                        } catch (IllegalArgumentException exc) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    String.format(
                                            RedisErrorMessages.INVALID_REDIS_COMMAND_ERROR_MSG,
                                            cmdAndArgs.get(CMD_KEY))));
                        }

                        Object commandOutput;
                        if (cmdAndArgs.containsKey(ARGS_KEY)) {
                            commandOutput = jedis.sendCommand(command, (String[]) cmdAndArgs.get(ARGS_KEY));
                        } else {
                            commandOutput = jedis.sendCommand(command);
                        }

                        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                        actionExecutionResult.setBody(
                                objectMapper.valueToTree(removeQuotes(processCommandOutput(commandOutput))));
                        actionExecutionResult.setIsExecutionSuccess(true);

                        log.debug(
                                Thread.currentThread().getName() + ": In the RedisPlugin, got action execution result");

                        return Mono.just(actionExecutionResult);
                    })
                    .flatMap(obj -> obj)
                    .map(obj -> (ActionExecutionResult) obj)
                    .onErrorResume(error -> {
                        error.printStackTrace();
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    RedisPluginError.QUERY_EXECUTION_FAILED,
                                    RedisErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    error.getMessage());
                        }
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned to the server
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

        /**
         * - This method removes the outermost quotes - single or double quotes - so that end users don't have to do
         * it via javascript on the UI editor.
         * - Some example inputs and outputs:
         * o "my val" -> my val
         * o 'my val' -> my val
         * o '{"key": "val"}' -> {"key": "val"}
         */
        private Object removeQuotes(Object result) {
            if (result instanceof String) {
                return ((String) result).replaceAll("^\\\"|^'|\\\"$|'$", "");
            } else if (result instanceof Collection) {
                return ((Collection) result).stream().map(this::removeQuotes).collect(Collectors.toList());
            } else if (result instanceof Map) {
                return ((Map<String, Object>) result)
                        .entrySet().stream()
                                .map(item -> Map.entry(item.getKey(), removeQuotes(item.getValue())))
                                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
            }

            return result;
        }

        private Map getCommandAndArgs(String query) {
            /**
             * - This regex matches either a whole word, or anything inside double quotes. If something is inside
             * single quotes then it gets matched like a whole word
             * - e.g. if the query string is: set key 'test match' "my val" '{"a":"b"}', then the regex matches the following:
             * (1) set
             * (2) key
             * (3) 'test match'
             * (4) "my val"
             * (5) '{"a":"b"}'
             * Please note that the above example string is not a valid redis cmd and is only mentioned here for info.
             */
            String redisCmdRegex = "\\\"[^\\\"]+\\\"|'[^']+'|[\\S]+";
            Pattern pattern = Pattern.compile(redisCmdRegex);
            Matcher matcher = pattern.matcher(query);
            Map<String, Object> cmdAndArgs = new HashMap<>();
            List<String> args = new ArrayList<>();
            while (matcher.find()) {
                if (!cmdAndArgs.containsKey(CMD_KEY)) {
                    cmdAndArgs.put(CMD_KEY, matcher.group().toUpperCase());
                } else {
                    args.add(matcher.group());
                }
            }

            if (args.size() > 0) {
                cmdAndArgs.put(ARGS_KEY, args.toArray(new String[0]));
            }

            return cmdAndArgs;
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
            log.debug(Thread.currentThread().getName() + ": datasourceCreate() called for Redis plugin.");
            return Mono.fromCallable(() -> {
                        final JedisPoolConfig poolConfig = buildPoolConfig();
                        int timeout =
                                (int) Duration.ofSeconds(CONNECTION_TIMEOUT).toMillis();
                        URI uri = RedisURIUtils.getURI(datasourceConfiguration);
                        JedisPool jedisPool = new JedisPool(poolConfig, uri, timeout);
                        log.debug(Thread.currentThread().getName() + ": Created Jedis pool.");
                        return jedisPool;
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(JedisPool jedisPool) {
            log.debug(Thread.currentThread().getName() + ": datasourceDestroy() called for Redis plugin.");
            // Schedule on elastic thread pool and subscribe immediately.
            Mono.fromSupplier(() -> {
                        try {
                            if (jedisPool != null) {
                                jedisPool.destroy();
                            }
                        } catch (JedisException e) {
                            log.error("Error destroying Jedis pool.");
                        }

                        return Mono.empty();
                    })
                    .subscribeOn(scheduler)
                    .subscribe();
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": validateDatasource() called for Redis plugin.");
            Set<String> invalids = new HashSet<>();

            if (isEndpointMissing(datasourceConfiguration.getEndpoints())) {
                invalids.add(RedisErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG);
            }

            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
            if (isAuthenticationMissing(auth)) {
                invalids.add(RedisErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
            }

            return invalids;
        }

        @Override
        public Mono<String> getEndpointIdentifierForRateLimit(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName()
                    + ": getEndpointIdentifierForRateLimit() called for Redis plugin.");
            List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
            String identifier = "";
            // When hostname and port both are available, both will be used as identifier
            // When port is not present, default port along with hostname will be used
            // This ensures rate limiting will only be applied if hostname is present
            if (endpoints.size() > 0) {
                String hostName = endpoints.get(0).getHost();
                Long port = endpoints.get(0).getPort();
                if (!isBlank(hostName)) {
                    identifier = hostName + "_" + ObjectUtils.defaultIfNull(port, RedisURIUtils.DEFAULT_PORT);
                }
            }
            return Mono.just(identifier);
        }

        private boolean isAuthenticationMissing(DBAuth auth) {
            /**
             * - Check if username exists without password.
             * - Following combinations are valid:
             *  (1) only password, no username
             *  (2) both username and password
             *  (3) neither username nor password - i.e. redis server has not auth config setup.
             */
            if (auth != null
                    && StringUtils.isNotNullOrEmpty(auth.getUsername())
                    && StringUtils.isNullOrEmpty(auth.getPassword())) {
                return true;
            }

            return false;
        }

        private boolean isEndpointMissing(List<Endpoint> endpoints) {
            /**
             * - Check if the endpoint is null or empty.
             * - Redis does not support backup connections, hence only need to check for one endpoint i.e index 0.
             */
            if (CollectionUtils.isEmpty(endpoints)
                    || endpoints.get(0) == null
                    || StringUtils.isNullOrEmpty(endpoints.get(0).getHost())) {
                return true;
            }

            return false;
        }

        private Mono<Void> verifyPing(JedisPool connectionPool) {
            String pingResponse;
            try {
                Jedis jedis = connectionPool.getResource();
                pingResponse = jedis.ping();
            } catch (Exception exc) {
                return Mono.error(exc);
            }

            if (!"PONG".equals(pingResponse)) {
                return Mono.error(new RuntimeException(
                        String.format(RedisErrorMessages.NO_PONG_RESPONSE_ERROR_MSG, pingResponse)));
            }

            return Mono.empty();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(JedisPool connectionPool) {
            log.debug(Thread.currentThread().getName() + ": testDatasource() called for Redis plugin.");

            return Mono.just(connectionPool)
                    .flatMap(c -> verifyPing(connectionPool))
                    .then(Mono.just(new DatasourceTestResult()))
                    .onErrorResume(error ->
                            Mono.just(new DatasourceTestResult(error.getCause().getMessage())));
        }
    }
}
