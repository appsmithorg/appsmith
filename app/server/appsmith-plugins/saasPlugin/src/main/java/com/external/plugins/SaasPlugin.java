package com.external.plugins;

import com.appsmith.external.dtos.ExecutePluginDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.SharedConfig;
import com.appsmith.util.SerializationUtils;
import com.appsmith.util.WebClientUtils;
import com.external.helpers.RequestCaptureFilter;
import com.external.plugins.exceptions.SaaSErrorMessages;
import com.external.plugins.exceptions.SaaSPluginError;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Set;

import static org.springframework.http.HttpHeaders.CONTENT_TYPE;
import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

public class SaasPlugin extends BasePlugin {
    private static final int MAX_REDIRECTS = 5;

    public SaasPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class SaasPluginExecutor implements PluginExecutor<ExecutePluginDTO>, SmartSubstitutionInterface {

        private final SharedConfig sharedConfig;
        // Setting max content length. This would've been coming from `spring.codec.max-in-memory-size` property if the
        // `WebClient` instance was loaded as an auto-wired bean.
        private final ExchangeStrategies EXCHANGE_STRATEGIES;
        private final ObjectMapper saasObjectMapper = SerializationUtils.getObjectMapperWithSourceInLocationEnabled();

        public SaasPluginExecutor(SharedConfig sharedConfig) {
            this.sharedConfig = sharedConfig;
            saasObjectMapper.disable(MapperFeature.USE_ANNOTATIONS);
            saasObjectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
            saasObjectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            this.EXCHANGE_STRATEGIES = ExchangeStrategies.builder()
                    .codecs(clientDefaultCodecsConfigurer -> {
                        clientDefaultCodecsConfigurer
                                .defaultCodecs()
                                .jackson2JsonEncoder(
                                        new Jackson2JsonEncoder(saasObjectMapper, MediaType.APPLICATION_JSON));
                        clientDefaultCodecsConfigurer.defaultCodecs().maxInMemorySize(sharedConfig.getCodecSize());
                    })
                    .build();
        }

        @Override
        public Mono<ActionExecutionResult> execute(
                ExecutePluginDTO connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": execute() called for Saas plugin.";
            System.out.println(printMessage);
            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();

            final String datasourceConfigurationCommand =
                    datasourceConfiguration.getAuthentication().getAuthenticationType();
            if (datasourceConfigurationCommand == null || datasourceConfigurationCommand.isEmpty()) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        SaaSErrorMessages.MISSING_DATASOURCE_TEMPLATE_NAME_ERROR_MSG));
            }

            final String actionConfigurationCommand =
                    (String) actionConfiguration.getFormData().get("command");
            if (actionConfigurationCommand == null || actionConfigurationCommand.isEmpty()) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SaaSErrorMessages.MISSING_ACTION_TEMPLATE_NAME_ERROR_MSG));
            }

            connection.setActionConfiguration(actionConfiguration);
            connection.setDatasourceTemplateName(datasourceConfigurationCommand);
            connection.setActionTemplateName(actionConfigurationCommand);

            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            URI uri = null;
            try {
                uri = uriBuilder
                        .uri(new URI(sharedConfig.getRemoteExecutionUrl()))
                        .build(true)
                        .toUri();
            } catch (URISyntaxException e) {
                e.printStackTrace();
            }

            ActionExecutionRequest actionExecutionRequest =
                    RequestCaptureFilter.populateRequestFields(actionConfiguration, uri, List.of(), objectMapper);

            // Initializing webClient to be used for http call
            WebClient.Builder webClientBuilder = WebClientUtils.builder();
            webClientBuilder.defaultHeader(CONTENT_TYPE, APPLICATION_JSON_VALUE);
            final RequestCaptureFilter requestCaptureFilter = new RequestCaptureFilter(objectMapper);
            webClientBuilder.filter(requestCaptureFilter);

            WebClient client =
                    webClientBuilder.exchangeStrategies(EXCHANGE_STRATEGIES).build();

            String valueAsString = "";
            try {
                System.out.println(
                        Thread.currentThread().getName() + ": objectMapper writing value as string for Saas plugin.");
                Stopwatch processStopwatch =
                        new Stopwatch("SaaS Plugin objectMapper writing value as string for connection");
                valueAsString = saasObjectMapper.writeValueAsString(connection);
                processStopwatch.stopAndLogTimeInMillisWithSysOut();
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
            Object requestBodyObj = BodyInserters.fromValue(valueAsString);

            // Triggering the actual REST API call
            return httpCall(client, HttpMethod.POST, uri, requestBodyObj, 0, APPLICATION_JSON_VALUE)
                    .map(stringResponseEntity -> {
                        final HttpStatusCode statusCode = stringResponseEntity.getStatusCode();
                        byte[] body = stringResponseEntity.getBody();
                        if (statusCode.is2xxSuccessful()) {
                            try {
                                System.out.println(Thread.currentThread().getName()
                                        + ": objectMapper reading value as string for Saas plugin.");
                                Stopwatch processStopwatch =
                                        new Stopwatch("SaaS Plugin objectMapper reading value as string for body");
                                ActionExecutionResult result =
                                        saasObjectMapper.readValue(body, ActionExecutionResult.class);
                                processStopwatch.stopAndLogTimeInMillisWithSysOut();
                                return result;
                            } catch (IOException e) {
                                throw Exceptions.propagate(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, body, e.getMessage()));
                            }
                        } else {
                            throw Exceptions.propagate(new AppsmithPluginException(
                                    SaaSPluginError.API_EXECUTION_FAILED,
                                    SaaSErrorMessages.API_EXECUTION_FAILED_ERROR_MSG,
                                    body));
                        }
                    })
                    .onErrorResume(error -> {
                        errorResult.setRequest(requestCaptureFilter.populateRequestFields(actionExecutionRequest));
                        errorResult.setIsExecutionSuccess(false);
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    SaaSPluginError.API_EXECUTION_FAILED,
                                    SaaSErrorMessages.API_EXECUTION_FAILED_ERROR_MSG,
                                    error.getMessage());
                        }
                        errorResult.setErrorInfo(error);
                        return Mono.just(errorResult);
                    });
        }

        private Mono<ResponseEntity<byte[]>> httpCall(
                WebClient webClient,
                HttpMethod httpMethod,
                URI uri,
                Object requestBody,
                int iteration,
                String contentType) {
            if (iteration == MAX_REDIRECTS) {
                return Mono.error(new AppsmithPluginException(
                        SaaSPluginError.API_EXECUTION_FAILED,
                        String.format(SaaSErrorMessages.MAX_REDIRECT_LIMIT_REACHED_ERROR_MSG, MAX_REDIRECTS)));
            }

            assert requestBody instanceof BodyInserter<?, ?>;
            BodyInserter<?, ?> finalRequestBody = (BodyInserter<?, ?>) requestBody;

            return webClient
                    .method(httpMethod)
                    .uri(uri)
                    .body((BodyInserter<?, ? super ClientHttpRequest>) finalRequestBody)
                    .retrieve()
                    .toEntity(byte[].class)
                    .doOnError(e -> Mono.error(new AppsmithPluginException(
                            SaaSPluginError.API_EXECUTION_FAILED, SaaSErrorMessages.API_EXECUTION_FAILED_ERROR_MSG, e)))
                    .flatMap(response -> {
                        if (response.getStatusCode().is3xxRedirection()) {
                            String redirectUrl =
                                    response.getHeaders().getLocation().toString();
                            /**
                             * TODO
                             * In case the redirected URL is not absolute (complete), create the new URL using the relative path
                             * This particular scenario is seen in the URL : https://rickandmortyapi.com/api/character
                             * It redirects to partial URI : /api/character/
                             * In this scenario we should convert the partial URI to complete URI
                             */
                            URI redirectUri;
                            try {
                                redirectUri = new URI(redirectUrl);
                            } catch (URISyntaxException e) {
                                return Mono.error(new AppsmithPluginException(
                                        SaaSPluginError.API_EXECUTION_FAILED,
                                        SaaSErrorMessages.URI_SYNTAX_WRONG_ERROR_MSG,
                                        e));
                            }
                            return httpCall(
                                    webClient, httpMethod, redirectUri, finalRequestBody, iteration + 1, contentType);
                        }
                        return Mono.just(response);
                    });
        }

        @Override
        public Mono<ExecutePluginDTO> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty();
        }

        @Override
        public void datasourceDestroy(ExecutePluginDTO connection) {}

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Set.of();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Mono.error(new AppsmithPluginException(SaaSPluginError.UNSUPPORTED_PLUGIN_OPERATION));
        }
    }
}
