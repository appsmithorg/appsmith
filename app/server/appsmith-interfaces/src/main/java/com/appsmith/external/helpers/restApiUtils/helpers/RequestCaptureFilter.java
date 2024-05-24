package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
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
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.StringJoiner;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.external.constants.CommonFieldName.FILE_TYPE;
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
    private final String MASKED_VALUE = "****";

    public RequestCaptureFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    @NonNull public Mono<ClientResponse> filter(@NonNull ClientRequest request, ExchangeFunction next) {
        this.request = request;
        return next.exchange(request);
    }

    private URI createURIWithMaskedQueryParam(URI uriToMask, String queryParamKeyToMask) {

        String query = uriToMask.getQuery();
        if (query == null) {
            return uriToMask;
        }
        String[] queryParams = query.split("&");
        StringJoiner newQuery = new StringJoiner("&");
        for (String queryParam : queryParams) {
            String[] keyValuePair = queryParam.split("=");

            if (queryParamKeyToMask.equals(keyValuePair[0])) {
                // fix when value is not present
                if (keyValuePair.length > 1) {
                    keyValuePair[1] = MASKED_VALUE;
                }
            }
            newQuery.add(keyValuePair[0] + "=" + keyValuePair[1]);
        }

        try {
            return new URI(
                    uriToMask.getScheme(),
                    uriToMask.getUserInfo(),
                    uriToMask.getHost(),
                    uriToMask.getPort(),
                    uriToMask.getPath(),
                    newQuery.toString(),
                    uriToMask.getRawFragment());
        } catch (URISyntaxException e) {
            return uriToMask;
        }
    }

    public ActionExecutionRequest populateRequestFields(
            ActionExecutionRequest existing,
            boolean isBodySentWithApiRequest,
            DatasourceConfiguration datasourceConfiguration) {
        final ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();

        if (request == null) {
            // The `request` can be null, if there's another filter function before `this.filter`,
            // which returns a `Mono.error` instead of the request object.
            return actionExecutionRequest;
        }

        AtomicBoolean isMultipart = new AtomicBoolean(false);

        String headerToMask = "";

        String URLString = request.url().toString();

        AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();

        // if authenticationType is api_key then check the addTo method and mask the api_key set by user accordingly.
        if (authentication instanceof ApiKeyAuth auth) {
            if (auth.getAddTo() != null) {
                if (auth.getAddTo().equals(ApiKeyAuth.Type.HEADER)) {
                    headerToMask = auth.getLabel();
                }
                if (auth.getAddTo().equals(ApiKeyAuth.Type.QUERY_PARAMS)) {
                    URI maskedURI = createURIWithMaskedQueryParam(request.url(), auth.getLabel());
                    URLString = maskedURI.toString();
                }
            }
        }
        String finalHeaderToMask = headerToMask;
        MultiValueMap<String, String> headers =
                CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));
        request.headers().forEach((header, value) -> {
            if (HttpHeaders.AUTHORIZATION.equalsIgnoreCase(header)
                    || "api_key".equalsIgnoreCase(header)
                    || finalHeaderToMask.equals(header)) {
                headers.add(header, MASKED_VALUE);
            } else {
                headers.addAll(header, value);
            }
            if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(header)
                    && MULTIPART_FORM_DATA_VALUE.equalsIgnoreCase(value.get(0))) {
                isMultipart.set(true);
            }
        });

        actionExecutionRequest.setUrl(URLString);
        actionExecutionRequest.setHeaders(objectMapper.valueToTree(headers));
        actionExecutionRequest.setHttpMethod(request.method());
        actionExecutionRequest.setRequestParams(existing.getRequestParams());
        actionExecutionRequest.setExecutionParameters(existing.getExecutionParameters());
        actionExecutionRequest.setProperties(existing.getProperties());

        // Apart from multipart, refer to the request that was actually sent
        if (!isMultipart.get()) {
            if (isBodySentWithApiRequest) {
                actionExecutionRequest.setBody(bodyReceiver.receiveValue(this.request.body()));
            }
        } else {
            actionExecutionRequest.setBody(existing.getBody());
        }
        return actionExecutionRequest;
    }

    public static ActionExecutionRequest populateRequestFields(
            ActionConfiguration actionConfiguration,
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
            MultiValueMap<String, String> reqMultiMap =
                    CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));

            actionConfiguration.getHeaders().forEach(header -> {
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
            bodyFormData
                    // Disregard keys that are null
                    .stream()
                    .filter(property -> property.getKey() != null)
                    .forEach(property -> bodyDataMap.put(property.getKey(), property.getValue()));
            actionExecutionRequest.setBody(bodyDataMap);
        } else if (MULTIPART_FORM_DATA_VALUE.equals(reqContentType.get())) {
            final List<Property> bodyFormData = actionConfiguration.getBodyFormData();
            Map<String, Object> bodyDataMap = new HashMap<>();
            bodyFormData
                    // Disregard keys that are null
                    .stream()
                    .filter(property -> property.getKey() != null)
                    .forEach(property -> {
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
