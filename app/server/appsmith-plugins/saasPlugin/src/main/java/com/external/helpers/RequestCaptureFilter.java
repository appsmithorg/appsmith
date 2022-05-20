package com.external.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedCaseInsensitiveMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.external.constants.FieldName.FILE_TYPE;
import static org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE;

/**
 * This filter captures the request that was sent out via WebClient so that the execution response can
 * accurately represent the actual request used
 */
@Getter
public class RequestCaptureFilter implements ExchangeFilterFunction {

    private ClientRequest request;
    private final ObjectMapper objectMapper;
    private final BodyReceiver bodyReceiver = new BodyReceiver();

    public RequestCaptureFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    @NonNull
    public Mono<ClientResponse> filter(@NonNull ClientRequest request, ExchangeFunction next) {
        this.request = request;
        return next.exchange(request);
    }

    public ActionExecutionRequest populateRequestFields(ActionExecutionRequest existing) {

        final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
        actionExecutionRequest.setUrl(request.url().toString());
        actionExecutionRequest.setHttpMethod(request.method());
        MultiValueMap<String, String> headers = CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));
        AtomicBoolean isMultipart = new AtomicBoolean(false);
        request.headers().forEach((header, value) -> {
            if (HttpHeaders.AUTHORIZATION.equalsIgnoreCase(header) || "api_key".equalsIgnoreCase(header)) {
                headers.add(header, "****");
            } else {
                headers.addAll(header, value);
            }
            if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(header) && MULTIPART_FORM_DATA_VALUE.equalsIgnoreCase(value.get(0))) {
                isMultipart.set(true);
            }
        });
        actionExecutionRequest.setHeaders(objectMapper.valueToTree(headers));

        actionExecutionRequest.setRequestParams(existing.getRequestParams());
        actionExecutionRequest.setExecutionParameters(existing.getExecutionParameters());
        actionExecutionRequest.setProperties(existing.getProperties());

        // Apart from multipart, refer to the request that was actually sent
        if (!isMultipart.get()) {
            actionExecutionRequest.setBody(bodyReceiver.receiveValue(this.request.body()));
        } else {
            actionExecutionRequest.setBody(existing.getBody());
        }

        return actionExecutionRequest;
    }

    public static ActionExecutionRequest populateRequestFields(ActionConfiguration actionConfiguration,
                                                               URI uri,
                                                               List<Map.Entry<String, String>> insertedParams,
                                                               ObjectMapper objectMapper) {

        ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();

        if (!insertedParams.isEmpty()) {
            final Map<String, Object> requestData = new HashMap<>();
            requestData.put("smart-substitution-parameters", insertedParams);
            actionExecutionRequest.setProperties(requestData);
        }

        AtomicReference<String> reqContentType = new AtomicReference<>();

        if (actionConfiguration.getHeaders() != null) {
            MultiValueMap<String, String> reqMultiMap = CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));

            actionConfiguration.getHeaders()
                    .forEach(header -> {
                        if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(header.getKey())) {
                            reqContentType.set((String) header.getValue());
                        }
                        reqMultiMap.put(header.getKey(), Arrays.asList((String) header.getValue()));
                    });
            actionExecutionRequest.setHeaders(objectMapper.valueToTree(reqMultiMap));
        }

        // If the body is set, then use that field as the request body by default
        if (actionConfiguration.getBody() != null) {
            actionExecutionRequest.setBody(actionConfiguration.getBody());
        }

        if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType.get())) {
            final List<Property> bodyFormData = actionConfiguration.getBodyFormData();
            Map<String, Object> bodyDataMap = new HashMap<>();
            bodyFormData.forEach(property -> bodyDataMap.put(property.getKey(), property.getValue()));
            actionExecutionRequest.setBody(bodyDataMap);
        } else if (MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType.get())) {
            final List<Property> bodyFormData = actionConfiguration.getBodyFormData();
            Map<String, Object> bodyDataMap = new HashMap<>();
            bodyFormData.forEach(property -> {
                if (FILE_TYPE.equalsIgnoreCase(property.getType())) {
                    bodyDataMap.put(property.getKey(), "<file>");
                } else {
                    bodyDataMap.put(property.getKey(), property.getValue());
                }
            });
            actionExecutionRequest.setBody(bodyDataMap);
        }

        if (actionConfiguration.getHttpMethod() != null) {
            actionExecutionRequest.setHttpMethod(actionConfiguration.getHttpMethod());
        }

        if (uri != null) {
            actionExecutionRequest.setUrl(uri.toString());
        }

        return actionExecutionRequest;
    }
}
