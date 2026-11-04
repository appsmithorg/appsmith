package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.util.RestrictedHostFilter;
import com.external.plugins.exceptions.RedisErrorMessages;
import com.external.plugins.exceptions.RedisPluginError;
import com.external.utils.RedisURIUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.pf4j.util.StringUtils;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import redis.clients.jedis.DefaultJedisClientConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisClientConfig;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import redis.clients.jedis.JedisSocketFactory;
import redis.clients.jedis.Protocol;
import redis.clients.jedis.exceptions.JedisException;
import redis.clients.jedis.util.JedisURIHelper;
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
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
public class RedisPlugin extends BasePlugin {
    private static final int CONNECTION_TIMEOUT = 60;
    private static final Pattern QUERY_TOKEN_PATTERN = Pattern.compile("\\\"[^\\\"]+\\\"|'[^']+'|[\\S]+");

    public RedisPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    private record ParsedCommand(String command, String[] args) {}

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

            return runOnPooledConnection(jedisPool, () -> parseStaticQuery(query), query, requestParams);
        }

        private Mono<ActionExecutionResult> runOnPooledConnection(
                JedisPool jedisPool,
                Callable<ParsedCommand> parser,
                String query,
                List<RequestParamDTO> requestParams) {
            // Borrowing from the pool is network I/O (connect, AUTH/SELECT, and a PING because testOnBorrow is on)
            // and blocks when the pool is exhausted, so it has to run on the plugin scheduler like the command.
            // Mono.using returns the Jedis to the pool on complete, error AND cancel, including a cancel that lands
            // while the borrow itself is still in flight; a plain fromCallable would discard that Jedis unreturned.
            // eager=false: the result is delivered before the Jedis is returned, so a failed return-to-pool cannot
            // fail a command that already executed.
            return Mono.using(
                            jedisPool::getResource,
                            jedis -> runCommand(jedis, parser, query, requestParams),
                            Jedis::close,
                            false)
                    .onErrorMap(
                            e -> !(e instanceof AppsmithPluginException),
                            e -> new AppsmithPluginException(
                                    RedisPluginError.QUERY_EXECUTION_FAILED,
                                    RedisErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    e.getMessage()))
                    .subscribeOn(scheduler);
        }

        /**
         * Executes the action with its bindings passed as Redis command arguments. The command and its argument
         * boundaries come from the query template, so a binding value is always sent as part of one argument.
         * Queries without bindings run through {@link #execute} unchanged.
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                JedisPool jedisPool,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            String template = actionConfiguration.getBody();
            if (StringUtils.isNullOrEmpty(template)
                    || MustacheHelper.extractMustacheKeysInOrder(template).isEmpty()) {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
                return execute(jedisPool, datasourceConfiguration, actionConfiguration);
            }

            List<Param> params = executeActionDTO == null || executeActionDTO.getParams() == null
                    ? List.of()
                    : executeActionDTO.getParams();

            // Generic substitution handles the other fields without rendering the query body.
            actionConfiguration.setBody(null);
            try {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
            } finally {
                actionConfiguration.setBody(template);
            }

            // The rendered query is shown in the request details only. It is never parsed or executed.
            String displayQuery = MustacheHelper.render(template, bindingValues(params));
            List<RequestParamDTO> requestParams =
                    List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, displayQuery, null, null, null));

            ParsedCommand parsedCommand;
            try {
                parsedCommand = parseQueryTemplate(template, params);
            } catch (AppsmithPluginException e) {
                ActionExecutionResult result = new ActionExecutionResult();
                result.setIsExecutionSuccess(false);
                result.setErrorInfo(e);
                ActionExecutionRequest request = new ActionExecutionRequest();
                request.setQuery(displayQuery);
                request.setRequestParams(requestParams);
                result.setRequest(request);
                return Mono.just(result);
            }

            return runOnPooledConnection(jedisPool, () -> parsedCommand, displayQuery, requestParams);
        }

        private Mono<ActionExecutionResult> runCommand(
                Jedis jedis, Callable<ParsedCommand> parser, String query, List<RequestParamDTO> requestParams) {
            return Mono.fromCallable(() -> {
                        ParsedCommand parsedCommand = parser.call();

                        Protocol.Command command;
                        try {
                            // Commands are in upper case
                            command = Protocol.Command.valueOf(parsedCommand.command());
                        } catch (IllegalArgumentException exc) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    String.format(
                                            RedisErrorMessages.INVALID_REDIS_COMMAND_ERROR_MSG,
                                            parsedCommand.command()));
                        }

                        Object commandOutput;
                        if (parsedCommand.args().length > 0) {
                            commandOutput = jedis.sendCommand(command, parsedCommand.args());
                        } else {
                            commandOutput = jedis.sendCommand(command);
                        }

                        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                        actionExecutionResult.setBody(
                                objectMapper.valueToTree(removeQuotes(processCommandOutput(commandOutput))));
                        actionExecutionResult.setIsExecutionSuccess(true);

                        log.debug(
                                Thread.currentThread().getName() + ": In the RedisPlugin, got action execution result");

                        return actionExecutionResult;
                    })
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
                    });
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

        /**
         * Splits a Redis query into tokens. A token is a whole word, or anything inside double quotes or single
         * quotes. For example, the query {@code set key 'test match' "my val"} gives the tokens {@code set},
         * {@code key}, {@code 'test match'} and {@code "my val"}.
         */
        private static List<String> splitQuery(String query) {
            Matcher matcher = QUERY_TOKEN_PATTERN.matcher(query);
            List<String> tokens = new ArrayList<>();
            while (matcher.find()) {
                tokens.add(matcher.group());
            }
            return tokens;
        }

        private static ParsedCommand parseStaticQuery(String query) throws AppsmithPluginException {
            if (StringUtils.isNullOrEmpty(query)) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        String.format(RedisErrorMessages.BODY_IS_NULL_OR_EMPTY_ERROR_MSG, query));
            }

            List<String> tokens = splitQuery(query.trim());
            if (tokens.isEmpty()) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        RedisErrorMessages.QUERY_PARSING_FAILED_ERROR_MSG);
            }

            return new ParsedCommand(
                    tokens.get(0).toUpperCase(),
                    tokens.subList(1, tokens.size()).toArray(new String[0]));
        }

        /**
         * Builds the command from the query template before any binding value is inserted. Each binding is
         * replaced with a marker, the marked template is split into tokens, and only then are the markers in each
         * token replaced with the binding values. A binding value therefore stays inside the token that holds its
         * binding and never changes the number of arguments. The command name must not contain a binding.
         */
        private static ParsedCommand parseQueryTemplate(String template, List<Param> params)
                throws AppsmithPluginException {
            String markerId = UUID.randomUUID().toString().replace("-", "");
            while (template.contains(markerId)) {
                markerId = UUID.randomUUID().toString().replace("-", "");
            }
            String markerPrefix = "__appsmith_binding_" + markerId + "_";
            String markerSuffix = "__";
            Pattern markerPattern =
                    Pattern.compile(Pattern.quote(markerPrefix) + "(\\d+)" + Pattern.quote(markerSuffix));

            StringBuilder markedTemplate = new StringBuilder();
            List<String> bindingKeys = new ArrayList<>();
            for (MustacheBindingToken token : MustacheHelper.tokenize(template)) {
                String value = token.getValue();
                if (value.startsWith("{{") && value.endsWith("}}")) {
                    bindingKeys.add(value.substring(2, value.length() - 2).trim());
                    markedTemplate
                            .append(markerPrefix)
                            .append(bindingKeys.size() - 1)
                            .append(markerSuffix);
                } else {
                    markedTemplate.append(value);
                }
            }

            List<String> tokens = splitQuery(markedTemplate.toString().trim());
            if (tokens.isEmpty()) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        RedisErrorMessages.QUERY_PARSING_FAILED_ERROR_MSG);
            }
            if (markerPattern.matcher(tokens.get(0)).find()) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        RedisErrorMessages.COMMAND_NAME_BINDING_ERROR_MSG);
            }

            Map<String, String> values = bindingValues(params);
            String[] args = new String[tokens.size() - 1];
            for (int i = 1; i < tokens.size(); i++) {
                Matcher matcher = markerPattern.matcher(tokens.get(i));
                StringBuilder arg = new StringBuilder();
                while (matcher.find()) {
                    String key = bindingKeys.get(Integer.parseInt(matcher.group(1)));
                    String bindingValue = values.get(key);
                    if (bindingValue == null) {
                        throw new AppsmithPluginException(AppsmithPluginError.SMART_SUBSTITUTION_VALUE_MISSING, key);
                    }
                    matcher.appendReplacement(arg, Matcher.quoteReplacement(bindingValue));
                }
                matcher.appendTail(arg);
                args[i - 1] = arg.toString();
            }

            return new ParsedCommand(tokens.get(0).toUpperCase(), args);
        }

        // Same key handling as PluginExecutor#variableSubstitution: keys are trimmed and the first value wins.
        private static Map<String, String> bindingValues(List<Param> params) {
            Map<String, String> values = new HashMap<>();
            for (Param param : params) {
                if (param != null && param.getKey() != null) {
                    values.putIfAbsent(param.getKey().trim(), param.getValue());
                }
            }
            return values;
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
                        // SSRF enforcement is layered (GHSA-qhfj-g87x-m39w):
                        //  1. assertHostAllowed below is an early, create-time pre-check so the user
                        //     sees "Host not allowed." immediately on Save/Test for an obviously
                        //     denylisted host. validateDatasource intentionally does not duplicate it
                        //     (its contract is format-only; host-policy belongs on the connection path).
                        //  2. The real, TOCTOU-proof guarantee is RestrictedHostJedisSocketFactory
                        //     (wired below), which re-validates with a SINGLE DNS resolution at the
                        //     moment the pool opens a socket and connects to the validated IP — so a
                        //     DNS-rebinding resolver cannot slip a different IP past the pre-check.
                        assertHostAllowed(datasourceConfiguration);
                        final JedisPoolConfig poolConfig = buildPoolConfig();
                        boolean isTlsEnabled = isTlsEnabled(datasourceConfiguration);
                        int timeout =
                                (int) Duration.ofSeconds(CONNECTION_TIMEOUT).toMillis();
                        URI uri = RedisURIUtils.getURI(datasourceConfiguration, isTlsEnabled);

                        // Derive the client config exactly as Jedis's own URI constructor does (user,
                        // password, db index, ssl scheme — see JedisFactory(URI, ...)), then route
                        // socket creation through RestrictedHostJedisSocketFactory. This preserves all
                        // existing URI parsing semantics while pinning the connection to a single
                        // SSRF-validated DNS resolution.
                        HostAndPort hostAndPort = new HostAndPort(uri.getHost(), uri.getPort());
                        JedisClientConfig clientConfig = DefaultJedisClientConfig.builder()
                                .connectionTimeoutMillis(timeout)
                                .socketTimeoutMillis(timeout)
                                .user(JedisURIHelper.getUser(uri))
                                .password(JedisURIHelper.getPassword(uri))
                                .database(JedisURIHelper.getDBIndex(uri))
                                .ssl(JedisURIHelper.isRedisSSLScheme(uri))
                                .build();
                        JedisSocketFactory socketFactory =
                                new RestrictedHostJedisSocketFactory(hostAndPort, clientConfig);
                        JedisPool jedisPool = new JedisPool(poolConfig, socketFactory, clientConfig);
                        log.debug(Thread.currentThread().getName() + ": Created Jedis pool.");
                        return jedisPool;
                    })
                    .subscribeOn(scheduler);
        }

        private void assertHostAllowed(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
            if (isEndpointMissing(datasourceConfiguration.getEndpoints())) {
                // Let the existing missing-host validation surface the error.
                return;
            }
            final String host = datasourceConfiguration.getEndpoints().get(0).getHost();
            // Create-time pre-check for fast, clear UX on Save/Test. This resolution and the one
            // Jedis performs at connect time are technically distinct, so this check alone is
            // subject to DNS rebinding — but it is no longer the security boundary:
            // RestrictedHostJedisSocketFactory re-validates with a single resolution at connect
            // time and is what actually closes the rebinding TOCTOU. See GHSA-qhfj-g87x-m39w.
            if (RestrictedHostFilter.isHostBlocked(host)) {
                // Most blocks land here (a user pointing a datasource at a disallowed host), so log
                // it as the primary observability signal — the log framework tags this with the
                // requesting userEmail / orgId / traceId, which makes a spike a useful recon flag.
                // The connect-time sibling (RestrictedHostJedisSocketFactory) logs the rarer
                // rebinding case.
                log.warn(
                        "Blocked a Redis datasource pointed at disallowed host '{}' (resolves to [{}]) — SSRF filter.",
                        host,
                        RestrictedHostFilter.describeResolvedAddresses(host));
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, RestrictedHostFilter.HOST_NOT_ALLOWED);
            }
        }

        private boolean isTlsEnabled(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
            if (datasourceConfiguration.getConnection() == null
                    || datasourceConfiguration.getConnection().getSsl() == null
                    || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
                return false;
            }

            SSLDetails.AuthType sslAuthType =
                    datasourceConfiguration.getConnection().getSsl().getAuthType();
            switch (sslAuthType) {
                case ENABLED:
                    return true;
                case DISABLED:
                    return false;
                default:
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            String.format(RedisErrorMessages.DS_UNEXPECTED_SSL_OPTION_ERROR_MSG, sslAuthType));
            }
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
            // SSRF host-allowed enforcement intentionally lives in datasourceCreate (which goes
            // through assertHostAllowed → RestrictedHostFilter.isHostBlocked on the
            // bounded-elastic scheduler) rather than here. PluginExecutor#validateDatasource is
            // documented as "mandatory fields and format only — does NOT check validity of
            // those fields; use testDatasource for that". Host-on-denylist is a policy/validity
            // check, not a format check, so it belongs on the connection path. testDatasource
            // calls datasourceCreate to build the pool and surfaces "Host not allowed."
            // immediately when the user clicks Test. See GHSA-qhfj-g87x-m39w.

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
            return Mono.fromCallable(() -> {
                        try (Jedis jedis = connectionPool.getResource()) {
                            return jedis.ping();
                        }
                    })
                    .flatMap(pingResponse -> {
                        if (!"PONG".equals(pingResponse)) {
                            return Mono.<Void>error(new RuntimeException(
                                    String.format(RedisErrorMessages.NO_PONG_RESPONSE_ERROR_MSG, pingResponse)));
                        }
                        return Mono.<Void>empty();
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(JedisPool connectionPool) {
            log.debug(Thread.currentThread().getName() + ": testDatasource() called for Redis plugin.");

            return Mono.just(connectionPool)
                    .flatMap(c -> verifyPing(connectionPool))
                    .then(Mono.just(new DatasourceTestResult()))
                    .onErrorResume(error -> {
                        // Prefer the cause's message (driver wraps connection failures with an
                        // IOException cause), but fall back to the error itself so a causeless
                        // exception doesn't NPE here. The connection-time SSRF rejection throws a
                        // causeless JedisConnectionException whose message is "Host not allowed.";
                        // without this fallback it surfaced as a generic connection error.
                        final Throwable reported = error.getCause() != null ? error.getCause() : error;
                        return Mono.just(new DatasourceTestResult(reported.getMessage()));
                    });
        }
    }
}
