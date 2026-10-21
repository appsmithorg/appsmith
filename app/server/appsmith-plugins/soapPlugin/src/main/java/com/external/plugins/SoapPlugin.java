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
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.util.WebClientUtils;
import com.external.plugins.WsdlParser.SoapOperation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.StringEscapeUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.w3c.dom.Element;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;

public class SoapPlugin extends BasePlugin {

    public SoapPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /** The connection is the WSDL's operations, keyed by {@link SoapOperation#key()}. */
    @Slf4j
    @Extension
    public static class SoapPluginExecutor implements PluginExecutor<Map<String, SoapOperation>> {

        static final String OPERATIONS_REQUEST_TYPE = "OPERATIONS";
        private static final Duration WSDL_FETCH_TIMEOUT = Duration.ofSeconds(30);

        // Carries the SSRF host filter, which applies to the WSDL fetch and to every request.
        private final WebClient webClient = WebClientUtils.create();

        @Override
        public Mono<Map<String, SoapOperation>> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": datasourceCreate() called for SOAP plugin.");
            String endpointOverride = endpointOverride(datasourceConfiguration);
            return webClient
                    .get()
                    .uri(URI.create(datasourceConfiguration.getUrl().strip()))
                    .headers(headers -> addBasicAuth(headers, datasourceConfiguration))
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .timeout(WSDL_FETCH_TIMEOUT)
                    .onErrorMap(
                            e -> !(e instanceof AppsmithPluginException),
                            e -> new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Could not fetch the WSDL: " + e.getMessage()))
                    .map(wsdl -> {
                        Map<String, SoapOperation> operations;
                        try {
                            operations = WsdlParser.parse(wsdl);
                        } catch (IllegalArgumentException e) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Could not read the WSDL: " + e.getMessage());
                        }
                        if (operations.isEmpty()) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "The WSDL has no SOAP 1.1 or 1.2 operations.");
                        }
                        if (endpointOverride == null) {
                            return operations;
                        }
                        Map<String, SoapOperation> overridden = new LinkedHashMap<>();
                        operations.forEach((key, op) -> overridden.put(key, op.withEndpoint(endpointOverride)));
                        return overridden;
                    });
        }

        @Override
        public void datasourceDestroy(Map<String, SoapOperation> connection) {
            // Nothing is held open; the connection is only the parsed WSDL.
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            Set<String> invalids = new HashSet<>();
            if (!StringUtils.hasText(datasourceConfiguration.getUrl())) {
                invalids.add("Missing WSDL URL.");
            } else if (!isHttpUrl(datasourceConfiguration.getUrl())) {
                invalids.add("WSDL URL must be an http:// or https:// URL.");
            }
            String endpointOverride = endpointOverride(datasourceConfiguration);
            if (endpointOverride != null && !isHttpUrl(endpointOverride)) {
                invalids.add("Endpoint URL override must be an http:// or https:// URL.");
            }
            return invalids;
        }

        @Override
        public Mono<TriggerResultDTO> trigger(
                Map<String, SoapOperation> connection,
                DatasourceConfiguration datasourceConfiguration,
                TriggerRequestDTO request) {
            if (!OPERATIONS_REQUEST_TYPE.equals(request.getRequestType())) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Unsupported request type: " + request.getRequestType()));
            }
            // A WSDL often exposes the same operations on a SOAP 1.1 and a SOAP 1.2 port; name the port then.
            boolean multiplePorts = connection.values().stream()
                            .map(SoapOperation::port)
                            .distinct()
                            .count()
                    > 1;
            List<Map<String, String>> options = connection.values().stream()
                    .map(op -> Map.of(
                            "label", multiplePorts ? op.name() + " (" + op.port() + ")" : op.name(), "value", op.key()))
                    .sorted(Comparator.comparing(option -> option.get("label")))
                    .collect(Collectors.toList());
            return Mono.just(new TriggerResultDTO(options));
        }

        /** Bound values are XML-escaped so widget input cannot inject elements into the envelope. */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                Map<String, SoapOperation> connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            if (executeActionDTO != null && executeActionDTO.getParams() != null) {
                Map<String, String> escapedParams = new HashMap<>();
                for (Param param : executeActionDTO.getParams()) {
                    if (param != null && param.getKey() != null) {
                        escapedParams.putIfAbsent(
                                param.getKey().trim(),
                                param.getValue() == null ? null : StringEscapeUtils.escapeXml10(param.getValue()));
                    }
                }
                actionConfiguration.setFormData(
                        MustacheHelper.renderFieldValues(actionConfiguration.getFormData(), escapedParams));
            }
            return execute(connection, datasourceConfiguration, actionConfiguration);
        }

        @Override
        public Mono<ActionExecutionResult> execute(
                Map<String, SoapOperation> connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            Map<String, Object> formData = actionConfiguration.getFormData();
            String operationKey = getDataValueSafelyFromFormData(formData, "operation", STRING_TYPE);
            SoapOperation operation = operationKey == null ? null : connection.get(operationKey);
            if (operation == null) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Select an operation from the WSDL."));
            }

            String envelope;
            try {
                envelope = SoapXml.envelope(
                        operation.version(),
                        getDataValueSafelyFromFormData(formData, "header", STRING_TYPE),
                        getDataValueSafelyFromFormData(formData, "body", STRING_TYPE));
            } catch (IllegalArgumentException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "The SOAP body or header is not well-formed XML: " + e.getMessage()));
            }

            HttpHeaders soapHeaders = soapHeaders(operation);
            ActionExecutionRequest request = new ActionExecutionRequest();
            request.setUrl(operation.endpoint());
            request.setHttpMethod(HttpMethod.POST);
            request.setBody(envelope);
            request.setHeaders(soapHeaders.toSingleValueMap());

            return webClient
                    .post()
                    .uri(URI.create(operation.endpoint()))
                    .headers(headers -> {
                        headers.addAll(soapHeaders);
                        addBasicAuth(headers, datasourceConfiguration);
                    })
                    .bodyValue(envelope.getBytes(StandardCharsets.UTF_8))
                    .exchangeToMono(response -> response.toEntity(byte[].class))
                    .map(entity -> toResult(entity, request))
                    .onErrorMap(
                            e -> !(e instanceof AppsmithPluginException),
                            e -> new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR, "SOAP request failed: " + e.getMessage()));
        }

        static HttpHeaders soapHeaders(SoapOperation operation) {
            HttpHeaders headers = new HttpHeaders();
            String action = operation.soapAction() == null ? "" : operation.soapAction();
            if (operation.version() == SoapXml.SoapVersion.SOAP_11) {
                headers.set(HttpHeaders.CONTENT_TYPE, operation.version().contentType);
                headers.set("SOAPAction", "\"" + action + "\"");
            } else {
                headers.set(
                        HttpHeaders.CONTENT_TYPE,
                        operation.version().contentType + (action.isEmpty() ? "" : "; action=\"" + action + "\""));
            }
            return headers;
        }

        static ActionExecutionResult toResult(ResponseEntity<byte[]> entity, ActionExecutionRequest request) {
            int status = entity.getStatusCode().value();
            byte[] bytes = entity.getBody() == null ? new byte[0] : entity.getBody();

            Object body;
            String error = null;
            try {
                Element content = SoapXml.bodyContent(bytes);
                body = content == null ? null : SoapXml.toValue(content);
                if (SoapXml.isFault(content)) {
                    error = SoapXml.faultMessage(content);
                } else if (status < 200 || status >= 300) {
                    error = "HTTP " + status;
                }
            } catch (IllegalArgumentException e) {
                body = new String(bytes, StandardCharsets.UTF_8);
                error = "HTTP " + status + ": the response is not a SOAP envelope (" + e.getMessage() + ")";
            }

            ActionExecutionResult result = new ActionExecutionResult();
            result.setIsExecutionSuccess(error == null);
            if (error != null) {
                result.setErrorInfo(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, error));
            }
            // After setErrorInfo, which overwrites body and statusCode with the error's.
            result.setRequest(request);
            result.setStatusCode(String.valueOf(status));
            result.setBody(body);
            return result;
        }

        private static void addBasicAuth(HttpHeaders headers, DatasourceConfiguration datasourceConfiguration) {
            if (datasourceConfiguration.getAuthentication() instanceof DBAuth auth
                    && StringUtils.hasText(auth.getUsername())) {
                headers.setBasicAuth(
                        auth.getUsername(),
                        auth.getPassword() == null ? "" : auth.getPassword(),
                        StandardCharsets.UTF_8);
            }
        }

        private static String endpointOverride(DatasourceConfiguration datasourceConfiguration) {
            List<Property> properties = datasourceConfiguration.getProperties();
            if (properties == null || properties.isEmpty() || properties.get(0) == null) {
                return null;
            }
            Object value = properties.get(0).getValue();
            return value == null || !StringUtils.hasText(String.valueOf(value))
                    ? null
                    : String.valueOf(value).strip();
        }

        private static boolean isHttpUrl(String url) {
            try {
                URI uri = URI.create(url.strip());
                return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                        && StringUtils.hasText(uri.getHost());
            } catch (IllegalArgumentException e) {
                return false;
            }
        }
    }
}
