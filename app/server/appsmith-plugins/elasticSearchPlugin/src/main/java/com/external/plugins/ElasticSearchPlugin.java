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
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.ConnectionReuseStrategy;
import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.StatusLine;
import org.apache.http.auth.AuthScheme;
import org.apache.http.auth.AuthSchemeProvider;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.AuthState;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthenticationStrategy;
import org.apache.http.client.CookieStore;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.RedirectStrategy;
import org.apache.http.client.UserTokenHandler;
import org.apache.http.client.config.AuthSchemes;
import org.apache.http.client.config.CookieSpecs;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.client.protocol.RequestAddCookies;
import org.apache.http.client.protocol.RequestAuthCache;
import org.apache.http.client.protocol.RequestClientConnControl;
import org.apache.http.client.protocol.RequestDefaultHeaders;
import org.apache.http.client.protocol.RequestExpectContinue;
import org.apache.http.client.protocol.ResponseProcessCookies;
import org.apache.http.concurrent.BasicFuture;
import org.apache.http.concurrent.FutureCallback;
import org.apache.http.config.Lookup;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.ConnectionKeepAliveStrategy;
import org.apache.http.conn.SchemePortResolver;
import org.apache.http.conn.routing.HttpRoutePlanner;
import org.apache.http.conn.ssl.DefaultHostnameVerifier;
import org.apache.http.conn.util.PublicSuffixMatcher;
import org.apache.http.conn.util.PublicSuffixMatcherLoader;
import org.apache.http.cookie.CookieSpecProvider;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.DefaultConnectionReuseStrategy;
import org.apache.http.impl.NoConnectionReuseStrategy;
import org.apache.http.impl.auth.BasicSchemeFactory;
import org.apache.http.impl.auth.DigestSchemeFactory;
import org.apache.http.impl.auth.KerberosSchemeFactory;
import org.apache.http.impl.auth.NTLMSchemeFactory;
import org.apache.http.impl.auth.SPNegoSchemeFactory;
import org.apache.http.impl.client.BasicCookieStore;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.DefaultConnectionKeepAliveStrategy;
import org.apache.http.impl.client.DefaultRedirectStrategy;
import org.apache.http.impl.client.ProxyAuthenticationStrategy;
import org.apache.http.impl.client.SystemDefaultCredentialsProvider;
import org.apache.http.impl.client.TargetAuthenticationStrategy;
import org.apache.http.impl.conn.DefaultProxyRoutePlanner;
import org.apache.http.impl.conn.DefaultRoutePlanner;
import org.apache.http.impl.conn.DefaultSchemePortResolver;
import org.apache.http.impl.conn.SystemDefaultDnsResolver;
import org.apache.http.impl.conn.SystemDefaultRoutePlanner;
import org.apache.http.impl.cookie.DefaultCookieSpecProvider;
import org.apache.http.impl.cookie.IgnoreSpecProvider;
import org.apache.http.impl.cookie.NetscapeDraftSpecProvider;
import org.apache.http.impl.cookie.RFC6265CookieSpecProvider;
import org.apache.http.impl.nio.client.AbstractClientExchangeHandler;
import org.apache.http.impl.nio.client.CloseableHttpPipeliningClient;
import org.apache.http.impl.nio.client.DefaultAsyncUserTokenHandler;
import org.apache.http.impl.nio.client.DefaultClientExchangeHandlerImpl;
import org.apache.http.impl.nio.client.FutureWrapper;
import org.apache.http.impl.nio.client.InternalClientExec;
import org.apache.http.impl.nio.client.InternalIODispatch;
import org.apache.http.impl.nio.client.MainClientExec;
import org.apache.http.impl.nio.conn.ManagedNHttpClientConnectionFactory;
import org.apache.http.impl.nio.conn.PoolingNHttpClientConnectionManager;
import org.apache.http.impl.nio.reactor.DefaultConnectingIOReactor;
import org.apache.http.impl.nio.reactor.IOReactorConfig;
import org.apache.http.message.BasicHeader;
import org.apache.http.nio.NHttpClientEventHandler;
import org.apache.http.nio.conn.NHttpClientConnectionManager;
import org.apache.http.nio.conn.NoopIOSessionStrategy;
import org.apache.http.nio.conn.SchemeIOSessionStrategy;
import org.apache.http.nio.conn.ssl.SSLIOSessionStrategy;
import org.apache.http.nio.entity.NStringEntity;
import org.apache.http.nio.protocol.HttpAsyncRequestExecutor;
import org.apache.http.nio.protocol.HttpAsyncRequestProducer;
import org.apache.http.nio.protocol.HttpAsyncResponseConsumer;
import org.apache.http.nio.reactor.ConnectingIOReactor;
import org.apache.http.nio.reactor.IOEventDispatch;
import org.apache.http.nio.reactor.IOReactorException;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;
import org.apache.http.protocol.HttpProcessor;
import org.apache.http.protocol.HttpProcessorBuilder;
import org.apache.http.protocol.RequestContent;
import org.apache.http.protocol.RequestTargetHost;
import org.apache.http.protocol.RequestUserAgent;
import org.apache.http.ssl.SSLContexts;
import org.elasticsearch.client.Node;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import java.io.IOException;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.ProxySelector;
import java.net.URL;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CancellationException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;

public class ElasticSearchPlugin extends BasePlugin {

    public ElasticSearchPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    public void makeClient() throws IOReactorException {
        PublicSuffixMatcher publicSuffixMatcher = null;
        if (publicSuffixMatcher == null) {
            publicSuffixMatcher = PublicSuffixMatcherLoader.getDefault();
        }

        NHttpClientConnectionManager connManager = null;
        if (connManager == null) {
            SchemeIOSessionStrategy sslStrategy = null;
            if (sslStrategy == null) {
                SSLContext sslcontext = null;
                if (sslcontext == null) {
                    if (false) {
                        sslcontext = SSLContexts.createSystemDefault();
                    } else {
                        sslcontext = SSLContexts.createDefault();
                    }
                }
                final String[] supportedProtocols = null;
                final String[] supportedCipherSuites = null;
                HostnameVerifier hostnameVerifier = null;
                if (hostnameVerifier == null) {
                    hostnameVerifier = new DefaultHostnameVerifier(publicSuffixMatcher);
                }
                sslStrategy = new SSLIOSessionStrategy(
                        sslcontext, supportedProtocols, supportedCipherSuites, hostnameVerifier);
            }
            final ConnectingIOReactor ioReactor = new DefaultConnectingIOReactor(IOReactorConfig.DEFAULT, null);
            final PoolingNHttpClientConnectionManager poolingmgr = new PoolingNHttpClientConnectionManager(
                    ioReactor,
                    ManagedNHttpClientConnectionFactory.INSTANCE,
                    RegistryBuilder.<SchemeIOSessionStrategy>create()
                            .register("http", NoopIOSessionStrategy.INSTANCE)
                            .register("https", sslStrategy)
                            .build(),
                    DefaultSchemePortResolver.INSTANCE,
                    SystemDefaultDnsResolver.INSTANCE,
                    -1,
                    TimeUnit.MILLISECONDS
            );
            poolingmgr.setMaxTotal(30);
            poolingmgr.setDefaultMaxPerRoute(10);
            connManager = poolingmgr;
        }
        ConnectionReuseStrategy reuseStrategy = null;
        if (reuseStrategy == null) {
            if (false) {
                final String s = System.getProperty("http.keepAlive", "true");
                if ("true".equalsIgnoreCase(s)) {
                    reuseStrategy = DefaultConnectionReuseStrategy.INSTANCE;
                } else {
                    reuseStrategy = NoConnectionReuseStrategy.INSTANCE;
                }
            } else {
                reuseStrategy = DefaultConnectionReuseStrategy.INSTANCE;
            }
        }
        ConnectionKeepAliveStrategy keepAliveStrategy = null;
        if (keepAliveStrategy == null) {
            keepAliveStrategy = DefaultConnectionKeepAliveStrategy.INSTANCE;
        }
        AuthenticationStrategy targetAuthStrategy = new TargetAuthenticationStrategy() {
            // Taken from PersistentCredentialsAuthenticationStrategy

            private final Log logger = LogFactory.getLog(TargetAuthenticationStrategy.class);

            @Override
            public void authFailed(HttpHost host, AuthScheme authScheme, HttpContext context) {
                if (logger.isDebugEnabled()) {
                    logger.debug(
                            "Authentication to "
                                    + host
                                    + " failed (scheme: "
                                    + authScheme.getSchemeName()
                                    + "). Preserving credentials for next request"
                    );
                }
                // Do nothing.
                // The superclass implementation of method will clear the credentials from the cache, but we don't
            }
        };
        if (targetAuthStrategy == null) {
            targetAuthStrategy = TargetAuthenticationStrategy.INSTANCE;
        }
        AuthenticationStrategy proxyAuthStrategy = null;
        if (proxyAuthStrategy == null) {
            proxyAuthStrategy = ProxyAuthenticationStrategy.INSTANCE;
        }
        UserTokenHandler userTokenHandler = null;
        if (userTokenHandler == null) {
            userTokenHandler = DefaultAsyncUserTokenHandler.INSTANCE;
        }
        SchemePortResolver schemePortResolver = null;
        if (schemePortResolver == null) {
            schemePortResolver = DefaultSchemePortResolver.INSTANCE;
        }

        HttpProcessor httpprocessor = null;
        if (httpprocessor == null) {
            String userAgent = "";

            final HttpProcessorBuilder b = HttpProcessorBuilder.create();
            b.addAll(
                    new RequestDefaultHeaders(null),
                    new RequestContent(),
                    new RequestTargetHost(),
                    new RequestClientConnControl(),
                    new RequestUserAgent(userAgent),
                    new RequestExpectContinue()
            );
            b.add(new RequestAddCookies());
            b.add(new RequestAuthCache());
            b.add(new ResponseProcessCookies());
            httpprocessor = b.build();
        }
        // Add redirect executor, if not disabled
        HttpRoutePlanner routePlanner = null;
        if (routePlanner == null) {
            HttpHost proxy = null;
            if (proxy != null) {
                routePlanner = new DefaultProxyRoutePlanner(proxy, schemePortResolver);
            } else if (false) {
                routePlanner = new SystemDefaultRoutePlanner(
                        schemePortResolver, ProxySelector.getDefault());
            } else {
                routePlanner = new DefaultRoutePlanner(schemePortResolver);
            }
        }
        Lookup<AuthSchemeProvider> authSchemeRegistry = null;
        if (authSchemeRegistry == null) {
            authSchemeRegistry = RegistryBuilder.<AuthSchemeProvider>create()
                    .register(AuthSchemes.BASIC, new BasicSchemeFactory())
                    .register(AuthSchemes.DIGEST, new DigestSchemeFactory())
                    .register(AuthSchemes.NTLM, new NTLMSchemeFactory())
                    .register(AuthSchemes.SPNEGO, new SPNegoSchemeFactory())
                    .register(AuthSchemes.KERBEROS, new KerberosSchemeFactory())
                    .build();
        }
        Lookup<CookieSpecProvider> cookieSpecRegistry = null;
        if (cookieSpecRegistry == null) {
            final CookieSpecProvider defaultProvider = new DefaultCookieSpecProvider(publicSuffixMatcher);
            final CookieSpecProvider laxStandardProvider = new RFC6265CookieSpecProvider(
                    RFC6265CookieSpecProvider.CompatibilityLevel.RELAXED, publicSuffixMatcher);
            final CookieSpecProvider strictStandardProvider = new RFC6265CookieSpecProvider(
                    RFC6265CookieSpecProvider.CompatibilityLevel.STRICT, publicSuffixMatcher);
            cookieSpecRegistry = RegistryBuilder.<CookieSpecProvider>create()
                    .register(CookieSpecs.DEFAULT, defaultProvider)
                    .register("best-match", defaultProvider)
                    .register("compatibility", defaultProvider)
                    .register(CookieSpecs.STANDARD, laxStandardProvider)
                    .register(CookieSpecs.STANDARD_STRICT, strictStandardProvider)
                    .register(CookieSpecs.NETSCAPE, new NetscapeDraftSpecProvider())
                    .register(CookieSpecs.IGNORE_COOKIES, new IgnoreSpecProvider())
                    .build();
        }

        CookieStore defaultCookieStore = null;
        if (defaultCookieStore == null) {
            defaultCookieStore = new BasicCookieStore();
        }

        CredentialsProvider defaultCredentialsProvider = null;
        if (defaultCredentialsProvider == null) {
            if (false) {
                defaultCredentialsProvider = new SystemDefaultCredentialsProvider();
            } else {
                defaultCredentialsProvider = new BasicCredentialsProvider();
            }
        }
        RedirectStrategy redirectStrategy = null;
        if (redirectStrategy == null) {
            redirectStrategy = DefaultRedirectStrategy.INSTANCE;
        }

        RequestConfig defaultRequestConfig = RequestConfig.custom()
                .setConnectTimeout(1_000)
                .setSocketTimeout(30_000)
                .build();
        if (defaultRequestConfig == null) {
            defaultRequestConfig = RequestConfig.DEFAULT;
        }

        final MainClientExec exec = new MainClientExec(
                httpprocessor,
                routePlanner,
                redirectStrategy,
                targetAuthStrategy,
                proxyAuthStrategy,
                userTokenHandler);

        ThreadFactory threadFactory = null;
        NHttpClientEventHandler eventHandler = null;
        if (!false) {
            threadFactory = null;
            if (threadFactory == null) {
                threadFactory = Executors.defaultThreadFactory();
            }
            eventHandler = null;
            if (eventHandler == null) {
                eventHandler = new HttpAsyncRequestExecutor();
            }
        }
        return new InternalHttpAsyncClient(
                connManager,
                reuseStrategy,
                keepAliveStrategy,
                threadFactory,
                eventHandler,
                exec,
                cookieSpecRegistry,
                authSchemeRegistry,
                defaultCookieStore,
                defaultCredentialsProvider,
                defaultRequestConfig);
    }

    abstract class CloseableHttpAsyncClientBase extends CloseableHttpPipeliningClient {

        private final Log log = LogFactory.getLog(getClass());

        static enum Status {INACTIVE, ACTIVE, STOPPED}

        private final NHttpClientConnectionManager connmgr;
        private final Thread reactorThread;

        private final AtomicReference<org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status> status;

        public CloseableHttpAsyncClientBase(
                final NHttpClientConnectionManager connmgr,
                final ThreadFactory threadFactory,
                final NHttpClientEventHandler handler) {
            super();
            this.connmgr = connmgr;
            if (threadFactory != null && handler != null) {
                this.reactorThread = threadFactory.newThread(new Runnable() {

                    @Override
                    public void run() {
                        try {
                            final IOEventDispatch ioEventDispatch = new InternalIODispatch(handler);
                            connmgr.execute(ioEventDispatch);
                        } catch (final Exception ex) {
                            log.error("I/O reactor terminated abnormally", ex);
                        } finally {
                            status.set(org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status.STOPPED);
                        }
                    }

                });
            } else {
                this.reactorThread = null;
            }
            this.status = new AtomicReference<org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status>(org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status.INACTIVE);
        }

        @Override
        public void start() {
            if (this.status.compareAndSet(org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status.INACTIVE, org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status.ACTIVE)) {
                if (this.reactorThread != null) {
                    this.reactorThread.start();
                }
            }
        }

        @Override
        public void close() {
            if (this.status.compareAndSet(org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status.ACTIVE, org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status.STOPPED)) {
                if (this.reactorThread != null) {
                    try {
                        this.connmgr.shutdown();
                    } catch (final IOException ex) {
                        this.log.error("I/O error shutting down connection manager", ex);
                    }
                    try {
                        this.reactorThread.join();
                    } catch (final InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }

        @Override
        public boolean isRunning() {
            return this.status.get() == org.apache.http.impl.nio.client.CloseableHttpAsyncClientBase.Status.ACTIVE;
        }

        final void execute(final AbstractClientExchangeHandler handler) {
            try {
                if (!isRunning()) {
                    throw new CancellationException("Request execution cancelled");
                }
                handler.start();
            } catch (final Exception ex) {
                handler.failed(ex);
            }
        }

    }

    class InternalHttpAsyncClient extends CloseableHttpAsyncClientBase {

        private final Log log = LogFactory.getLog(getClass());

        private final NHttpClientConnectionManager connmgr;
        private final ConnectionReuseStrategy connReuseStrategy;
        private final ConnectionKeepAliveStrategy keepaliveStrategy;
        private final InternalClientExec exec;
        private final Lookup<CookieSpecProvider> cookieSpecRegistry;
        private final Lookup<AuthSchemeProvider> authSchemeRegistry;
        private final CookieStore cookieStore;
        private final CredentialsProvider credentialsProvider;
        private final RequestConfig defaultConfig;

        public InternalHttpAsyncClient(
                final NHttpClientConnectionManager connmgr,
                final ConnectionReuseStrategy connReuseStrategy,
                final ConnectionKeepAliveStrategy keepaliveStrategy,
                final ThreadFactory threadFactory,
                final NHttpClientEventHandler handler,
                final InternalClientExec exec,
                final Lookup<CookieSpecProvider> cookieSpecRegistry,
                final Lookup<AuthSchemeProvider> authSchemeRegistry,
                final CookieStore cookieStore,
                final CredentialsProvider credentialsProvider,
                final RequestConfig defaultConfig) {
            super(connmgr, threadFactory, handler);
            this.connmgr = connmgr;
            this.connReuseStrategy = connReuseStrategy;
            this.keepaliveStrategy = keepaliveStrategy;
            this.exec = exec;
            this.cookieSpecRegistry = cookieSpecRegistry;
            this.authSchemeRegistry = authSchemeRegistry;
            this.cookieStore = cookieStore;
            this.credentialsProvider = credentialsProvider;
            this.defaultConfig = defaultConfig;
        }

        private void setupContext(final HttpClientContext context) {
            if (context.getAttribute(HttpClientContext.TARGET_AUTH_STATE) == null) {
                context.setAttribute(HttpClientContext.TARGET_AUTH_STATE, new AuthState());
            }
            if (context.getAttribute(HttpClientContext.PROXY_AUTH_STATE) == null) {
                context.setAttribute(HttpClientContext.PROXY_AUTH_STATE, new AuthState());
            }
            if (context.getAttribute(HttpClientContext.AUTHSCHEME_REGISTRY) == null) {
                context.setAttribute(HttpClientContext.AUTHSCHEME_REGISTRY, this.authSchemeRegistry);
            }
            if (context.getAttribute(HttpClientContext.COOKIESPEC_REGISTRY) == null) {
                context.setAttribute(HttpClientContext.COOKIESPEC_REGISTRY, this.cookieSpecRegistry);
            }
            if (context.getAttribute(HttpClientContext.COOKIE_STORE) == null) {
                context.setAttribute(HttpClientContext.COOKIE_STORE, this.cookieStore);
            }
            if (context.getAttribute(HttpClientContext.CREDS_PROVIDER) == null) {
                context.setAttribute(HttpClientContext.CREDS_PROVIDER, this.credentialsProvider);
            }
            if (context.getAttribute(HttpClientContext.REQUEST_CONFIG) == null) {
                context.setAttribute(HttpClientContext.REQUEST_CONFIG, this.defaultConfig);
            }
        }

        @Override
        public <T> Future<T> execute(
                final HttpAsyncRequestProducer requestProducer,
                final HttpAsyncResponseConsumer<T> responseConsumer,
                final HttpContext context,
                final FutureCallback<T> callback) {
            final BasicFuture<T> future = new BasicFuture<T>(callback);
            final HttpClientContext localcontext = HttpClientContext.adapt(
                    context != null ? context : new BasicHttpContext());
            setupContext(localcontext);

            final DefaultClientExchangeHandlerImpl<T> handler = new DefaultClientExchangeHandlerImpl<T>(
                    this.log,
                    requestProducer,
                    responseConsumer,
                    localcontext,
                    future,
                    this.connmgr,
                    this.connReuseStrategy,
                    this.keepaliveStrategy,
                    this.exec);
            execute(handler);
            return new FutureWrapper<T>(future, handler);
        }

        @Override
        public <T> Future<List<T>> execute(
                final HttpHost target,
                final List<? extends HttpAsyncRequestProducer> requestProducers,
                final List<? extends HttpAsyncResponseConsumer<T>> responseConsumers,
                final HttpContext context,
                final FutureCallback<List<T>> callback) {
            throw new UnsupportedOperationException("Pipelining not supported");
        }

    }

    @Slf4j
    @Extension
    public static class ElasticSearchPluginExecutor implements PluginExecutor<RestClient> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        private static final Pattern patternForUnauthorized = Pattern.compile(
                ".*unauthorized.*",
                Pattern.CASE_INSENSITIVE
        );

        private static final Pattern patternForNotFound = Pattern.compile(
                ".*not.?found|refused|not.?known|timed?\\s?out.*",
                Pattern.CASE_INSENSITIVE
        );

        private static final Set<String> DISALLOWED_HOSTS = Set.of(
                "169.254.169.254",
                "metadata.google.internal"
        );

        @Override
        public Mono<ActionExecutionResult> execute(RestClient client,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            final Map<String, Object> requestData = new HashMap<>();

            String query = actionConfiguration.getBody();
            List<RequestParamDTO> requestParams = new ArrayList<>();

            return Mono.fromCallable(() -> {
                        final ActionExecutionResult result = new ActionExecutionResult();

                        String body = query;

                        final String path = actionConfiguration.getPath();
                        requestData.put("path", path);

                        HttpMethod httpMethod = actionConfiguration.getHttpMethod();
                        requestData.put("method", httpMethod.name());
                        requestParams.add(new RequestParamDTO("actionConfiguration.httpMethod", httpMethod.name(), null,
                                null, null));
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, path, null, null, null));
                        requestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY, query, null, null, null));

                        final Request request = new Request(httpMethod.toString(), path);
                        ContentType contentType = ContentType.APPLICATION_JSON;

                        if (isBulkQuery(path)) {
                            contentType = ContentType.create("application/x-ndjson");

                            // If body is a JSON Array, convert it to an ND-JSON string.
                            if (body != null && body.trim().startsWith("[")) {
                                final StringBuilder ndJsonBuilder = new StringBuilder();
                                try {
                                    List<Object> commands = objectMapper.readValue(body, ArrayList.class);
                                    for (Object object : commands) {
                                        ndJsonBuilder.append(objectMapper.writeValueAsString(object)).append("\n");
                                    }
                                } catch (IOException e) {
                                    final String message = "Error converting array to ND-JSON: " + e.getMessage();
                                    log.warn(message, e);
                                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, message));
                                }
                                body = ndJsonBuilder.toString();
                            }
                        }

                        if (body != null) {
                            request.setEntity(new NStringEntity(body, contentType));
                        }

                        try {
                            final String responseBody = new String(
                                    client.performRequest(request).getEntity().getContent().readAllBytes());
                            result.setBody(objectMapper.readValue(responseBody, HashMap.class));
                        } catch (IOException e) {
                            final String message = "Error performing request: " + e.getMessage();
                            log.warn(message, e);
                            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, message));
                        }

                        result.setIsExecutionSuccess(true);
                        log.debug("In the Elastic Search Plugin, got action execution result");
                        return Mono.just(result);
                    })
                    .flatMap(obj -> obj)
                    .map(obj -> (ActionExecutionResult) obj)
                    .onErrorResume(error -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned back to the server
                    .map(result -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setProperties(requestData);
                        request.setQuery(query);
                        request.setRequestParams(requestParams);
                        ActionExecutionResult actionExecutionResult = result;
                        actionExecutionResult.setRequest(request);
                        return actionExecutionResult;
                    })
                    .subscribeOn(scheduler);
        }

        private static boolean isBulkQuery(String path) {
            return path.split("\\?", 1)[0].matches(".*\\b_bulk$");
        }

        @Override
        public Mono<RestClient> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {

            final List<HttpHost> hosts = new ArrayList<>();

            for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                URL url;
                try {
                    url = new URL(endpoint.getHost());
                } catch (MalformedURLException e) {
                    return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            "Invalid host provided. It should be of the form http(s)://your-es-url.com"));
                }
                String scheme = "http";
                if (url.getProtocol() != null) {
                    scheme = url.getProtocol();
                }

                hosts.add(new HttpHost(url.getHost(), endpoint.getPort().intValue(), scheme));
            }

            final RestClientBuilder clientBuilder = RestClient.builder(hosts.toArray(new HttpHost[]{}));

            clientBuilder.setHttpClientConfigCallback(httpClientBuilder -> {
                httpClientBuilder.setSSLHostnameVerifier((hostname, session) -> {
                    return !DISALLOWED_HOSTS.contains(hostname);
                });
                return httpClientBuilder;
            });

            clientBuilder.setRequestConfigCallback(requestConfigBuilder -> {
                requestConfigBuilder.setConnectTimeout(10000);
                requestConfigBuilder.setSocketTimeout(60000);
                return requestConfigBuilder;
            });

            clientBuilder.setNodeSelector(nodes -> {
                for (Iterator<Node> itr = nodes.iterator(); itr.hasNext();) {
                    final Node node = itr.next();
                    if (DISALLOWED_HOSTS.contains(node.getHost().getHostName())
                            || DISALLOWED_HOSTS.contains(node.getHost().getAddress().getHostAddress())) {
                        itr.remove();
                    }
                }
            });

            final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (authentication != null
                    && !StringUtils.isEmpty(authentication.getUsername())
                    && !StringUtils.isEmpty(authentication.getPassword())) {
                final CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
                credentialsProvider.setCredentials(
                        AuthScope.ANY,
                        new UsernamePasswordCredentials(authentication.getUsername(), authentication.getPassword())
                );

                clientBuilder
                        .setHttpClientConfigCallback(
                                httpClientBuilder -> httpClientBuilder
                                        .setDefaultCredentialsProvider(credentialsProvider)
                        );
            }

            if (!CollectionUtils.isEmpty(datasourceConfiguration.getHeaders())) {
                clientBuilder.setDefaultHeaders(
                        (Header[]) datasourceConfiguration.getHeaders()
                                .stream()
                                .map(h -> new BasicHeader(h.getKey(), (String) h.getValue()))
                                .toArray()
                );
            }

            return Mono.fromCallable(() -> Mono.just(clientBuilder.build()))
                    .flatMap(obj -> obj)
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(RestClient client) {
            try {
                client.close();
            } catch (IOException e) {
                log.warn("Error closing connection to ElasticSearch.", e);
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();

            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("No endpoint provided. Please provide a host:port where ElasticSearch is reachable.");
            } else {
                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {

                    if (endpoint.getHost() == null) {
                        invalids.add("Missing host for endpoint");
                    } else {
                        try {
                            URL url = new URL(endpoint.getHost());
                            if (DISALLOWED_HOSTS.contains(url.getHost())
                                    || DISALLOWED_HOSTS.contains(InetAddress.getByName(url.getHost()).getHostAddress())) {
                                invalids.add("Invalid host provided.");
                            }
                        } catch (MalformedURLException e) {
                            invalids.add("Invalid host provided. It should be of the form http(s)://your-es-url.com");
                        } catch (UnknownHostException e) {
                            invalids.add("Either your host URL is invalid or the page you are trying to access does not exist");
                        }
                    }

                    if (endpoint.getPort() == null) {
                        invalids.add("Missing port for endpoint");
                    }
                }

            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .map(client -> {
                        if (client == null) {
                            return new DatasourceTestResult("Null client object to ElasticSearch.");
                        }
                        // This HEAD request is to check if the base of datasource exists. It responds with 200 if the index exists,
                        // 404 if it doesn't. We just check for either of these two.
                        // Ref: https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-exists.html
                        Request request = new Request("HEAD", "/");

                        final Response response;
                        try {
                            response = client.performRequest(request);
                        } catch (IOException e) {
                            final String message = e.getMessage();

                            /* since the 401, and 403 are registered as IOException, but for the given connection it
                             * in the current rest-client. We will figure out with matching patterns with regexes.
                             */

                            if (patternForUnauthorized.matcher(message).find()) {
                                return new DatasourceTestResult("Your username or password is not correct");
                            }

                            if (patternForNotFound.matcher(message).find()) {
                                return new DatasourceTestResult("Either your host URL is invalid or the page you are trying to access does not exist");
                            }

                            if (message.contains("rejected all nodes")) {
                                return new DatasourceTestResult("Host(s) not allowed.");
                            }

                            return new DatasourceTestResult("Error running HEAD request: " + message);
                        }

                        final StatusLine statusLine = response.getStatusLine();

                        try {
                            client.close();
                        } catch (IOException e) {
                            log.warn("Error closing ElasticSearch client that was made for testing.", e);
                        }
                        // earlier it was 404 and 200, now it has been changed to just expect 200 status code
                        // here it checks if it is anything else than 200, even 404 is not allowed!
                        if (statusLine.getStatusCode() == 404) {
                            return new DatasourceTestResult("Either your host URL is invalid or the page you are trying to access does not exist");
                        }

                        if (statusLine.getStatusCode() != 200) {
                            return new DatasourceTestResult(
                                    "Unexpected response from ElasticSearch: " + statusLine);
                        }

                        return new DatasourceTestResult();
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(error.getMessage())))
                    .subscribeOn(scheduler);
        }
    }
}
