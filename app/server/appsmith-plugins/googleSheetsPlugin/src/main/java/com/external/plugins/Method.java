package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Property;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;

public enum Method {
    GET {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(GET);
                uriBuilder.uri(new URI(GET.baseSheetsUrl + "/"
                        + pluginSpecifiedTemplates.get(1).getValue()
                        + "/values/"
                        + pluginSpecifiedTemplates.get(2).getValue()));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            return webClient.method(HttpMethod.GET)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.empty());
        }
    },
    INFO {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(INFO);
                uriBuilder.uri(new URI(INFO.baseSheetsUrl + "/" + pluginSpecifiedTemplates.get(1).getValue()));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            uriBuilder.queryParam("ranges", pluginSpecifiedTemplates.get(2).getValue());
            uriBuilder.queryParam("includeGridData", Boolean.FALSE);
            return webClient.method(HttpMethod.GET)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.empty());
        }
    },
    LIST {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(LIST);
                uriBuilder.uri(new URI(LIST.baseDriveUrl + "/?q=mimeType='application/vnd.google-apps.spreadsheet'"));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            return webClient.method(HttpMethod.GET)
                    .uri(uriBuilder.build(false).toUri())
                    .body(BodyInserters.empty());
        }
    },
    APPEND {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(APPEND);
                uriBuilder.uri(new URI(APPEND.baseSheetsUrl + "/"
                        + pluginSpecifiedTemplates.get(1).getValue()
                        + "/values/"
                        + pluginSpecifiedTemplates.get(2).getValue()
                        + ":append"));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
            uriBuilder.queryParam("insertDataOption", "OVERWRITE");
            uriBuilder.queryParam("includeValuesInResponse", Boolean.TRUE);
            return webClient.method(HttpMethod.POST)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.fromObject(body));
        }
    },
    UPDATE {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(UPDATE);
                uriBuilder.uri(new URI(UPDATE.baseSheetsUrl + "/" + pluginSpecifiedTemplates.get(1).getValue() + "/values/" + pluginSpecifiedTemplates.get(2).getValue()));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
            uriBuilder.queryParam("includeValuesInResponse", Boolean.TRUE);
            return webClient.method(HttpMethod.PUT)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.fromObject(body));
        }
    },
    BULK_UPDATE {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(BULK_UPDATE);
                uriBuilder.uri(new URI(BULK_UPDATE.baseSheetsUrl + "/" + pluginSpecifiedTemplates.get(1).getValue() + "/values:batchUpdate"));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            return webClient.method(HttpMethod.POST)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.fromObject(body));
        }
    },
    CLEAR {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(CLEAR);
                uriBuilder.uri(new URI(CLEAR.baseSheetsUrl + "/"
                        + pluginSpecifiedTemplates.get(1).getValue()
                        + "/values/"
                        + pluginSpecifiedTemplates.get(2).getValue()
                        + ":clear"));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            return webClient.method(HttpMethod.POST)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.empty());
        }
    },
    CREATE {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient
                                                                 webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(CREATE);
                uriBuilder.uri(new URI(CREATE.baseSheetsUrl));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            return webClient.method(HttpMethod.POST)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.fromObject(body));
        }
    },

    COPY {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient
                                                                 webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(COPY);
                uriBuilder.uri(new URI(COPY.baseSheetsUrl + "/"
                        + pluginSpecifiedTemplates.get(1).getValue()
                        + "/sheets/"
                        + pluginSpecifiedTemplates.get(3).getValue()
                        + ":copyTo"));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            return webClient.method(HttpMethod.POST)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.fromObject(body));
        }
    },

    DELETE {
        public WebClient.RequestHeadersSpec<?> getClient(WebClient
                                                                 webClient, List<Property> pluginSpecifiedTemplates, String body) {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            try {
                Objects.requireNonNull(DELETE);
                uriBuilder.uri(new URI(DELETE.baseSheetsUrl + "/" + pluginSpecifiedTemplates.get(1).getValue() + ":batchUpdate"));
            } catch (URISyntaxException e) {
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unable to create URI"));
            }
            return webClient.method(HttpMethod.POST)
                    .uri(uriBuilder.build(true).toUri())
                    .body(BodyInserters.fromValue(
                            Map.of(
                                    "requests", List.of(
                                            Map.of(
                                                    "deleteSheet", Map.of(
                                                            "sheetId", pluginSpecifiedTemplates.get(3).getValue()))))));
        }
    };

    private final String baseSheetsUrl = "https://sheets.googleapis.com/v4/spreadsheets";

    private final String baseDriveUrl = "https://www.googleapis.com/drive/v3/files";

    public abstract WebClient.RequestHeadersSpec<?> getClient(WebClient paramWebClient, List<Property> paramList, String paramString);

}
