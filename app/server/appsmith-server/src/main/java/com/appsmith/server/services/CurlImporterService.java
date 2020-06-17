package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@Slf4j
public class CurlImporterService extends BaseApiImporter {

    private static final String RESTAPI_PLUGIN = "restapi-plugin";

    private static final String ARG_DATA = "--data";
    private static final String ARG_HEADER = "--header";
    private static final String ARG_REQUEST = "--request";
    private static final String ARG_COOKIE = "--cookie";
    private static final String ARG_USER = "--user";
    private static final String ARG_USER_AGENT = "--user-agent";

    private final ActionService actionService;
    private final PluginService pluginService;

    public CurlImporterService(ActionService actionService, PluginService pluginService) {
        this.actionService = actionService;
        this.pluginService = pluginService;
    }

    @Override
    public Mono<Action> importAction(Object input, String pageId, String name, String orgId) {
        Action action = curlToAction((String) input, pageId, name);

        if (action == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_CURL_COMMAND));
        }

        // Set the default values for datasource (plugin, name) and then create the action
        // with embedded datasource
        return pluginService.findByPackageName(RESTAPI_PLUGIN)
                .flatMap(plugin -> {
                    final Datasource datasource = action.getDatasource();
                    final DatasourceConfiguration datasourceConfiguration = datasource.getDatasourceConfiguration();
                    datasource.setName(datasourceConfiguration.getUrl());
                    datasource.setPluginId(plugin.getId());
                    datasource.setOrganizationId(orgId);
                    return Mono.just(action);
                })
                .flatMap(actionService::create);
    }

    public Action curlToAction(String command, String pageId, String name) {
        Action action = curlToAction(command);
        if (action != null) {
            action.setPageId(pageId);
            action.setName(name);
        }
        return action;
    }

    public Action curlToAction(String command) {
        // Three stages of parsing the cURL command:
        // 1. lex: Split the string into tokens, respecting the quoting semantics of a POSIX-compliant shell.
        // 2. normalize: Normalize all the command line arguments of a curl command, into their long-form versions.
        //    E.g., `-X` into `--request`.
        // 3. parse: Parse the arguments in this list of tokens into an `Action` object.

        // Strip a trailing semicolon, if present.
        command = command.strip();
        if (command.endsWith(";")) {
            command = command.substring(0, command.length() - 1).stripTrailing();
        }

        return parse(normalize(lex(command)));
    }

    /**
     * Splits the given string into tokens using quoting semantics close to a typical POSIX shell.
     *
     * @param text String Text to tokenize.
     * @return List of String tokens. The tokens don't include quote characters that were use to delineate the tokens.
     */
    public List<String> lex(String text) {
        final List<String> tokens = new ArrayList<>();

        final String trimmedText = text.trim();
        final int textLength = trimmedText.length();
        final StringBuilder currentToken = new StringBuilder();
        Character quote = null;
        boolean isEscaped = false;

        for (int i = 0; i < textLength; ++i) {
            char currentChar = trimmedText.charAt(i);

            if (quote != null) {
                // We are inside quotes.

                if (isEscaped) {
                    currentToken.append(currentChar);
                    isEscaped = false;

                } else if (currentChar == '\\') {
                    isEscaped = true;

                } else if (currentChar == quote) {
                    quote = null;

                } else {
                    currentToken.append(currentChar);

                }

            } else {
                // We are out in the open. Whitespace here terminates tokens.

                if (isEscaped) {
                    // We are at a character that's next to an escaping backslash.
                    if (currentChar != '\n') {
                        currentToken.append(currentChar);
                    }
                    isEscaped = false;

                } else if (currentChar == '\\') {
                    // This is a backslash that will escape the next character.
                    isEscaped = true;

                } else if (currentChar == '\n' || currentChar == '#') {
                    // End of the line or rest is a comment.
                    break;

                } else if (currentChar == ' ' || currentChar == '\t') {
                    // White space lying around between arguments. This delineates tokens.
                    if (currentToken.length() > 0) {
                        tokens.add(currentToken.toString());
                        currentToken.setLength(0);
                    }

                } else if (currentChar == '"' || currentChar == '\'') {
                    // Start of a quoted token.
                    quote = currentChar;

                } else {
                    currentToken.append(currentChar);

                }

            }

        }

        if (currentToken.length() > 0) {
            tokens.add(currentToken.toString());
        }

        return tokens;
    }

    /**
     * Normalizes curl command arguments. For example, inputs like `-XGET`, `-X GET`, `--request GET` are all converted
     * to look like `--request GET`.
     *
     * @param tokens List of command-line arguments, possibly non-normalized.
     * @return A new list of strings with normalized arguments.
     */
    public List<String> normalize(List<String> tokens) {
        final List<String> normalizedTokens = new ArrayList<>();

        for (String token : tokens) {
            if ("-d".equals(token)
                    || "--data-ascii".equals(token)
                    || "--data-raw".equals(token)) {
                normalizedTokens.add(ARG_DATA);

            } else if (token.startsWith("-d")) {
                // `-dstuff` -> `--data stuff`
                normalizedTokens.add(ARG_DATA);
                if (token.length() > 2) {
                    normalizedTokens.add(token.substring(2));
                }

            } else if ("-H".equals(token)) {
                normalizedTokens.add(ARG_HEADER);

            } else if (token.startsWith("-H")) {
                // `-HContent-Type:application/json` -> `--header Content-Type:application/json`
                normalizedTokens.add(ARG_HEADER);
                if (token.length() > 2) {
                    normalizedTokens.add(token.substring(2));
                }

            } else if ("-X".equals(token)) {
                normalizedTokens.add(ARG_REQUEST);

            } else if (token.startsWith("-X")) {
                // `-XGET` -> `--request GET`
                normalizedTokens.add(ARG_REQUEST);
                if (token.length() > 2) {
                    normalizedTokens.add(token.substring(2).toUpperCase());
                }

            } else if ("-b".equals(token)) {
                normalizedTokens.add(ARG_COOKIE);

            } else if ("-u".equals(token)) {
                normalizedTokens.add(ARG_USER);

            } else if ("-A".equals(token)) {
                normalizedTokens.add(ARG_USER_AGENT);

            } else if (!"--url".equals(token)) {
                // We skip the `--url` argument since it's superfluous and URLs are directly sniffed out of the argument
                // list. The `--url` argument holds no special significance in cURL.
                normalizedTokens.add(token);

            }

        }

        return normalizedTokens;
    }

    public Action parse(List<String> tokens) {
        // Curl argument parsing as per <https://linux.die.net/man/1/curl>.

        if (!"curl".equals(tokens.get(0))) {
            // Doesn't look like a curl command.
            return null;
        }

        final Action action = new Action();
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        action.setActionConfiguration(actionConfiguration);

        final Datasource datasource = new Datasource();
        action.setDatasource(datasource);
        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        final List<Property> headers = new ArrayList<>();
        boolean isContentTypeSet = false;
        final List<String> dataParts = new ArrayList<>();

        String state = null;

        for (int i = 1; i < tokens.size(); ++i) {
            String token = tokens.get(i);
            boolean isStateProcessed = true;

            if (ARG_REQUEST.equals(state)) {
                // The `token` is next to `--request`.
                actionConfiguration.setHttpMethod(HttpMethod.valueOf(token.toUpperCase()));

            } else if (ARG_HEADER.equals(state)) {
                // The `token` is next to `--header`.
                final String[] parts = token.split(":\\s+", 2);
                if ("content-type".equalsIgnoreCase(parts[0])) {
                    isContentTypeSet = true;
                }
                headers.add(new Property(parts[0], parts[1]));

            } else if (ARG_DATA.equals(state)) {
                // The `token` is next to `--data`.
                dataParts.add(token);

            } else if ("--data-urlencode".equals(state)) {
                // The `token` is next to `--data-urlencode`.
                if (token.startsWith("=")) {
                    dataParts.add(urlEncode(token.substring(1)));
                } else if (token.contains("=")) {
                    final String[] parts = token.split("=", 2);
                    dataParts.add(parts[0] + "=" + urlEncode(parts[1]));
                } else {
                    dataParts.add(urlEncode(token));
                }

            } else if (ARG_COOKIE.equals(state)) {
                // The `token` is next to `--data-cookie`.
                headers.add(new Property("Set-Cookie", token));

            } else if (ARG_USER.equals(state)) {
                // The `token` is next to `--user`.
                headers.add(new Property(
                        "Authorization",
                        "Basic " + Base64.getEncoder().encodeToString(token.getBytes())
                ));

            } else if (ARG_USER_AGENT.equals(state)) {
                // The `token` is next to `--user-agent`.
                headers.add(new Property("User-Agent", token));

            } else if (token.startsWith("-")) {
                // This is an option, in cURL's terminology. The next token would be the value of this option.
                state = token;
                isStateProcessed = false;

            } else {
                // Anything that doesn't start with `-` would be treated as a URL by cURL.
                try {
                    trySaveURL(action, token);
                } catch (MalformedURLException | URISyntaxException e) {
                    // Ignore this argument. May be there's a valid URL later down the arguments list.
                }

            }

            if (isStateProcessed) {
                state = null;
            }

        }

        if (!isContentTypeSet && !dataParts.isEmpty()) {
            headers.add(new Property("Content-Type", "application/x-www-form-urlencoded"));
        }

        if (!headers.isEmpty()) {
            actionConfiguration.setHeaders(headers);
        }

        if (!dataParts.isEmpty()) {
            actionConfiguration.setBody(StringUtils.join(dataParts, '&'));
        }

        if (actionConfiguration.getHttpMethod() == null) {
            // Default HTTP method is POST if there is body data to send, else GET.
            actionConfiguration.setHttpMethod(dataParts.isEmpty() ? HttpMethod.GET : HttpMethod.POST);
        }

        return action;
    }

    private void trySaveURL(Action action, String token) throws MalformedURLException, URISyntaxException {
        // If the URL appears to not have a protocol set, prepend the `https` protocol.
        if (!token.matches("\\w+://.*")) {
            token = "http://" + token;
        }

        // If the string doesn't throw an exception when being converted to a URI, its a valid URL.
        URL url = new URL(token);

        String path = url.getPath();
        String base = url.getProtocol() + "://" + url.getHost() + getPort(url);

        log.debug("cURL import URL: '{}', path: '{}' baseUrl: '{}'", url, path, base);

        // Extract query params.
        URI uri = url.toURI();
        List<NameValuePair> params = URLEncodedUtils.parse(uri, StandardCharsets.UTF_8);
        final ActionConfiguration actionConfiguration = action.getActionConfiguration();
        List<Property> queryParameters = actionConfiguration.getQueryParameters();

        if (queryParameters == null) {
            queryParameters = new ArrayList<>();
            actionConfiguration.setQueryParameters(queryParameters);
        }

        for (NameValuePair param : params) {
            queryParameters.add(new Property(param.getName(), param.getValue()));
        }

        // Set the URL without the query params & the path.
        action.getDatasource().getDatasourceConfiguration().setUrl(base);

        // Set the path in actionConfiguration.
        actionConfiguration.setPath(path);
    }

    private String getPort(URL url) {
        if (url.getPort() != -1) {
            return ":" + url.getPort();
        }
        return "";
    }

    private static String urlEncode(String text) {
        return URLEncoder.encode(text, StandardCharsets.UTF_8);
    }
}
