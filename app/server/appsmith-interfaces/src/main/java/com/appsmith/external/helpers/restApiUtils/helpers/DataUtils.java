package com.appsmith.external.helpers.restApiUtils.helpers;

import com.appsmith.external.dtos.MultipartFormDataDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ApiContentType;
import com.appsmith.external.models.Property;
import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import com.google.gson.ToNumberPolicy;
import com.google.gson.reflect.TypeToken;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import net.minidev.json.writer.CollectionMapper;
import net.minidev.json.writer.JsonReader;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

public class DataUtils {

    public static String FIELD_API_CONTENT_TYPE = "apiContentType";

    public static String BASE64_DELIMITER = ";base64,";

    /**
     * this Gson builder has three parameters for creating a gson instances which is required to maintain the JSON as received
     * setLenient() : allows parsing of JSONs which don't strictly adhere to RFC4627 (our older implementation is also more permissive)
     * setObjectToNumberStrategy(): How to parse numbers which comes as a part of JSON objects
     * i.e. [4, 5.5, 7] --> [4, 5.5, 7] (with lazily parsed numbers), default was [4.0, 5.5, 7.0]
     * setNumberToNumberStrategy() : same as above but only applies to number json
     * 4 -> 4,  4.7 --> 4.7
     */
    private static final Gson gson = new GsonBuilder()
            .setLenient()
            .setObjectToNumberStrategy(ToNumberPolicy.LAZILY_PARSED_NUMBER)
            .setNumberToNumberStrategy(ToNumberPolicy.LAZILY_PARSED_NUMBER)
            .create();

    private static final JSONParser jsonParser = new JSONParser(JSONParser.MODE_PERMISSIVE);

    private final ObjectMapper objectMapper;

    public enum MultipartFormDataType {
        TEXT,
        FILE,
        ARRAY,
        // this is for allowing application/json in Multipart from data
        JSON,
    }

    public DataUtils() {
        this.objectMapper = SerializationUtils.getObjectMapperWithSourceInLocationEnabled()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        // Multipart data would be parsed using object mapper, these files may be large in the size.
        // Hence, the length should not be truncated, therefore allowing maximum length.
        this.objectMapper
                .getFactory()
                .setStreamReadConstraints(StreamReadConstraints.builder()
                        .maxStringLength(Integer.MAX_VALUE)
                        .build());
    }

    public BodyInserter<?, ?> buildBodyInserter(Object body, String contentType, Boolean encodeParamsToggle) {
        if (body == null) {
            return BodyInserters.fromValue(new byte[0]);
        }
        switch (contentType) {
            case MediaType.APPLICATION_JSON_VALUE:
                final Object bodyObject = parseJsonBody(body);
                return BodyInserters.fromValue(bodyObject);
            case MediaType.APPLICATION_FORM_URLENCODED_VALUE:
                final String formData = parseFormData((List<Property>) body, encodeParamsToggle);
                if ("".equals(formData)) {
                    return BodyInserters.fromValue(new byte[0]);
                }
                return BodyInserters.fromValue(formData);
            case MediaType.MULTIPART_FORM_DATA_VALUE:
                return parseMultipartFileData((List<Property>) body);
            case MediaType.TEXT_PLAIN_VALUE:
                return BodyInserters.fromValue((String) body);
            case MediaType.APPLICATION_OCTET_STREAM_VALUE:
                return parseMultimediaData((String) body);
            default:
                return BodyInserters.fromValue(((String) body).getBytes(StandardCharsets.ISO_8859_1));
        }
    }

    public Object parseJsonBody(Object body) {
        try {
            if (body instanceof String) {
                // Setting the requestBody to an empty byte array here
                // since the an empty string causes issues with a signed request.
                // If the content of the SignableRequest is null, the query string parameters
                // will be encoded and used as the contentSha256 segment of the canonical request string.
                // This causes a SignatureMatch Error for signed urls like those generated by AWS S3.
                // More detail here - https://github.com/aws/aws-sdk-java/issues/2205
                if ("" == body) {
                    return new byte[0];
                }
                Object objectFromJson = objectFromJson((String) body);
                if (objectFromJson != null) {
                    body = objectFromJson;
                }
            }
        } catch (JsonSyntaxException | ParseException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, body, "Malformed JSON: " + e.getMessage());
        }
        return body;
    }

    public String parseFormData(List<Property> bodyFormData, Boolean encodeParamsToggle) {
        if (bodyFormData == null || bodyFormData.isEmpty()) {
            return "";
        }

        return bodyFormData
                // Disregard keys that are null
                .stream()
                .filter(property -> property.getKey() != null)
                .map(property -> {
                    String key = property.getKey();
                    String value = (String) property.getValue();

                    if (encodeParamsToggle == true) {
                        try {
                            value = URLEncoder.encode(value, StandardCharsets.UTF_8.toString());
                        } catch (UnsupportedEncodingException e) {
                            throw new UnsupportedOperationException(e);
                        }
                    }

                    return key + "=" + value;
                })
                .collect(Collectors.joining("&"));
    }

    public BodyInserter<?, ?> parseMultimediaData(String requestBodyObj) {
        // This decoding for base64 is required because of
        // issue https://github.com/appsmithorg/appsmith/issues/32378
        // According to this if we tried to upload any multimedia files (img, audio, video)
        // It was not getting decoded before uploading on required URL
        if (requestBodyObj.contains(BASE64_DELIMITER)) {
            List<String> bodyArrayList = Arrays.asList(requestBodyObj.split(BASE64_DELIMITER));
            requestBodyObj = bodyArrayList.get(bodyArrayList.size() - 1);

            // Using mimeDecoder here, since base64 conversion by file picker widget follows mime standard
            byte[] payload = Base64.getMimeDecoder().decode(bodyArrayList.get(bodyArrayList.size() - 1));
            return BodyInserters.fromValue(payload);
        }

        return BodyInserters.fromValue(requestBodyObj);
    }

    public BodyInserter<?, ?> parseMultipartFileData(List<Property> bodyFormData) {
        if (bodyFormData == null || bodyFormData.isEmpty()) {
            return BodyInserters.fromValue(new byte[0]);
        }

        return (BodyInserter<?, ClientHttpRequest>) (outputMessage, context) -> Mono.defer(() -> {
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();

            for (Property property : bodyFormData) {
                final String key = property.getKey();

                if (property.getKey() == null) {
                    continue;
                }

                // null values are not accepted by the Mutli-part form data standards,
                // null values cannot be achieved via client side changes, hence skipping the form-data property
                // altogether instead of throwing an error over here.
                if (property.getValue() == null) {
                    continue;
                }

                // This condition is for the current scenario, while we wait for client changes to come in
                // before the migration can be introduced
                if (property.getType() == null) {
                    bodyBuilder.part(key, property.getValue());
                    continue;
                }

                final MultipartFormDataType multipartFormDataType =
                        MultipartFormDataType.valueOf(property.getType().toUpperCase(Locale.ROOT));

                switch (multipartFormDataType) {
                    case TEXT:
                        byte[] valueBytesArray = new byte[0];
                        if (StringUtils.hasLength(String.valueOf(property.getValue()))) {
                            valueBytesArray =
                                    String.valueOf(property.getValue()).getBytes(StandardCharsets.ISO_8859_1);
                        }
                        bodyBuilder.part(key, valueBytesArray, MediaType.TEXT_PLAIN);
                        break;
                    case FILE:
                        try {
                            populateFileTypeBodyBuilder(bodyBuilder, property, outputMessage);
                        } catch (IOException e) {
                            e.printStackTrace();
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "Unable to parse content. Expected to receive an array or object of multipart data");
                        }
                        break;
                    case ARRAY:
                        if (property.getValue() instanceof String) {
                            final String value = (String) property.getValue();
                            try {
                                final JsonNode jsonNode = objectMapper.readTree(value);
                                if (jsonNode.isArray()) {
                                    for (JsonNode node : jsonNode) {
                                        if (node.isTextual()) bodyBuilder.part(key, node.asText());
                                        else bodyBuilder.part(key, node);
                                    }
                                } else {
                                    bodyBuilder.part(key, value);
                                }
                            } catch (JsonProcessingException e) {
                                bodyBuilder.part(key, value);
                            }
                        } else {
                            bodyBuilder.part(key, property.getValue());
                        }
                        break;
                    case JSON:
                        // apart from String we can expect json list or a JSON dictionary as input,
                        // while spring would typecast a json list to List, a Json Dictionary is not always expected to
                        // be type-casted as a map, hence this has been chosen to be built as it is.
                        if (!(property.getValue() instanceof String jsonString)) {
                            bodyBuilder.part(key, property.getValue(), MediaType.APPLICATION_JSON);
                            break;
                        }

                        if (!StringUtils.hasText(jsonString)) {
                            // the jsonString is empty, it could be intended by the user hence continuing execution.
                            bodyBuilder.part(key, "", MediaType.APPLICATION_JSON);
                            break;
                        }

                        Object objectFromJson;
                        try {
                            objectFromJson = objectFromJson(jsonString);
                        } catch (JsonSyntaxException | ParseException e) {
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                    jsonString,
                                    "Malformed JSON: " + e.getMessage());
                        }

                        if (objectFromJson == null) {
                            // Although this is not expected to be true; However, in case the parsed object is null,
                            // choosing to error out as the value provided by user has not transformed into json.
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, jsonString);
                        } else {
                            bodyBuilder.part(key, objectFromJson, MediaType.APPLICATION_JSON);
                        }
                        break;
                }
            }

            final BodyInserters.MultipartInserter multipartInserter =
                    BodyInserters.fromMultipartData(bodyBuilder.build());
            return multipartInserter.insert(outputMessage, context);
        });
    }

    private void populateFileTypeBodyBuilder(
            MultipartBodyBuilder bodyBuilder, Property property, ClientHttpRequest outputMessage) throws IOException {
        final String fileValue = (String) property.getValue();
        final String key = property.getKey();
        List<MultipartFormDataDTO> multipartFormDataDTOs = new ArrayList<>();

        if (fileValue.startsWith("{")) {
            // Check whether the JSON string is an object
            final MultipartFormDataDTO multipartFormDataDTO =
                    objectMapper.readValue(fileValue, MultipartFormDataDTO.class);
            multipartFormDataDTOs.add(multipartFormDataDTO);
        } else if (fileValue.startsWith("[")) {
            // Check whether the JSON string is an array
            multipartFormDataDTOs = Arrays.asList(objectMapper.readValue(fileValue, MultipartFormDataDTO[].class));
        } else {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "Unable to parse content. Expected to receive an array or object of multipart data");
        }

        multipartFormDataDTOs.forEach(multipartFormDataDTO -> {
            final MultipartFormDataDTO finalMultipartFormDataDTO = multipartFormDataDTO;
            Flux<DataBuffer> data = DataBufferUtils.readInputStream(
                    () -> new ByteArrayInputStream(
                            String.valueOf(finalMultipartFormDataDTO.getData()).getBytes(StandardCharsets.ISO_8859_1)),
                    outputMessage.bufferFactory(),
                    4096);

            bodyBuilder
                    .asyncPart(key, data, DataBuffer.class)
                    .filename(multipartFormDataDTO.getName())
                    .contentType(MediaType.valueOf(multipartFormDataDTO.getType()));
        });
    }

    /**
     * Given a JSON string, we infer the top-level type of the object it represents and then parse it into that
     * type. However, only `Map` and `List` top-levels are supported. Note that the map or list may contain
     * anything, like booleans or number or even more maps or lists. It's only that the top-level type should be a
     * map / list.
     *
     * @param jsonString A string that confirms to JSON syntax. Shouldn't be null.
     * @return An object of type `Map`, `List`, if applicable, or `null`.
     */
    private static Object objectFromJson(String jsonString) throws ParseException {
        Class<?> type;
        String trimmed = jsonString.trim();

        if (trimmed.startsWith("{")) {
            type = Map.class;
        } else if (trimmed.startsWith("[")) {
            type = List.class;
        } else {
            return null;
        }

        // For both list and Map type we have used fallback parsing strategies, First GSON tries to parse
        // the jsonString (we've used gson because the native jsonObject gson uses to parse JSON is implemented on top
        // of linkedHashMaps, which preserves the order of attributes),
        // however if gson encounters any errors, which could arise due to a lenient jsonString
        // i.e. { "a" : "one", "b" : "two",} (Notice the comma at the end), this is not a valid json according to
        // RFC4627. GSON would fail here, however JsonParser from net.minidev would parse this in permissive mode.

        if (type.equals(List.class)) {
            return parseJsonIntoListWithOrderedObjects(jsonString, gson, jsonParser);
        } else {
            // We learned from issue #23456 that some use-cases require the order of keys to be preserved
            //  i.e. for AWS authorisation, one signature header is required whose value holds the hash
            // of the body.
            return parseJsonIntoOrderedObject(jsonString, gson, jsonParser);
        }
    }

    private static Object parseJsonIntoListWithOrderedObjects(String jsonString, Gson gson, JSONParser jsonParser)
            throws ParseException {
        TypeToken<List<Object>> listTypeToken = new TypeToken<>() {};
        try {
            return gson.fromJson(jsonString, listTypeToken.getType());
        } catch (JsonSyntaxException jsonSyntaxException) {
            return jsonParser.parse(jsonString);
        }
    }

    private static Object parseJsonIntoOrderedObject(String jsonString, Gson gson, JSONParser jsonParser)
            throws ParseException {
        TypeToken<LinkedHashMap<String, Object>> linkedHashMapTypeToken = new TypeToken<>() {};
        try {
            return gson.fromJson(jsonString, linkedHashMapTypeToken.getType());
        } catch (JsonSyntaxException jsonSyntaxException) {
            JsonReader jsonReader = new JsonReader();
            CollectionMapper.MapClass<LinkedHashMap<String, Object>> collectionMapper =
                    new CollectionMapper.MapClass<>(jsonReader, linkedHashMapTypeToken.getRawType());
            return jsonParser.parse(jsonString, collectionMapper);
        }
    }

    public Object getRequestBodyObject(
            ActionConfiguration actionConfiguration,
            String reqContentType,
            boolean encodeParamsToggle,
            HttpMethod httpMethod) {
        // We will read the request body for all HTTP calls where the apiContentType is NOT "none".
        // This is irrespective of the content-type header or the HTTP method
        String apiContentTypeStr = (String)
                PluginUtils.getValueSafelyFromFormData(actionConfiguration.getFormData(), FIELD_API_CONTENT_TYPE);
        ApiContentType apiContentType = ApiContentType.getValueFromString(apiContentTypeStr);

        if (HttpMethod.GET.equals(httpMethod) && (apiContentType == null || apiContentType == ApiContentType.NONE)) {
            /**
             * Setting request body object to null makes the webClient object to ignore the body when sending the API
             * request. Earlier, we were setting it to an empty string, which worked fine for almost all the use
             * cases, however it caused error when used to call Figma's GET API call. Figma's server detected that
             * there is a body attached with the request and would return with a `BAD REQUEST` error.
             * Ref: https://github.com/appsmithorg/appsmith/issues/14894
             */
            return null;
        }

        // We initialize this object to an empty string because body can never be empty
        // Based on the content-type, this Object may be of type MultiValueMap or String
        Object requestBodyObj = "";

        if (!HttpMethod.GET.equals(httpMethod)) {
            // Read the body normally as this is a non-GET request
            requestBodyObj = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
        } else if (apiContentType != null && apiContentType != ApiContentType.NONE) {
            // This is a GET request
            // For all existing GET APIs, the apiContentType will be null. Hence we don't read the body
            // Also, any new APIs which have apiContentType set to NONE shouldn't read the body.
            // All other API content types should read the body
            requestBodyObj = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
        }

        if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType)
                || MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType)) {
            requestBodyObj = actionConfiguration.getBodyFormData();
        }

        requestBodyObj = this.buildBodyInserter(requestBodyObj, reqContentType, encodeParamsToggle);

        return requestBodyObj;
    }
}
