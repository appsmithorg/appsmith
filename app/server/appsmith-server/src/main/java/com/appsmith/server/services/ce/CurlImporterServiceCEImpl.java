package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.BaseApiImporter;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Slf4j
public class CurlImporterServiceCEImpl extends BaseApiImporter implements CurlImporterServiceCE {
    private static class CharConstants {
        public static final char TAB = '\t';
        public static final char OPEN_QUOTE = '(';
        public static final String EQUAL = "=";
        public static final String AMPERSAND = "&";
        private static final char DOLLAR = '$';
        private static final char SINGLE_QUOTE = '\'';
        private static final char DOUBLE_QUOTE = '\"';
        private static final char BACK_TICK = '`';
        private static final char BACK_SLASH = '\\';
        private static final char NEW_LINE = '\n';
        private static final char HASH_TAG = '#';
        private static final char SPACE = ' ';
    }

    private static class ArgConstants {
        private static final String DATA_SHORT = "-d";
        private static final String DATA_RAW = "--data-raw";
        private static final String DATA_ASCII = "--data-ascii";
        private static final String DATA = "--data";

        private static final String FORM_SHORT = "-F";
        private static final String FORM = "--form";

        private static final String HEADER_SHORT = "-H";
        private static final String HEADER = "--header";

        private static final String REQUEST_SHORT = "-X";
        private static final String REQUEST = "--request";

        private static final String COOKIE_SHORT = "-b";
        private static final String COOKIE = "--cookie";

        private static final String USER_SHORT = "-u";
        private static final String USER = "--user";

        private static final String USER_AGENT_SHORT = "-A";
        private static final String USER_AGENT = "--user-agent";

        private static final String URL = "--url";
    }

    private static final String URL_ENCODE_REGEX = "([A-Za-z0-9%._\\-/]+=[^\\s]+)";
    private static final String URL_PROTOCOL_REGEX = "\\w+://.*";
    private static final String SCHEME_DELIMITER = "://";
    private static final String HTTP_PROTOCOL_PREFIX = "http" + SCHEME_DELIMITER;
    private static final String RESTAPI_PLUGIN = "restapi-plugin";
    private static final String API_CONTENT_TYPE_KEY = "apiContentType";

    private final PluginService pluginService;
    private final LayoutActionService layoutActionService;
    private final ResponseUtils responseUtils;
    private final NewPageService newPageService;
    private final ObjectMapper objectMapper;
    private final PagePermission pagePermission;

    public CurlImporterServiceCEImpl(
            PluginService pluginService,
            LayoutActionService layoutActionService,
            NewPageService newPageService,
            ResponseUtils responseUtils,
            ObjectMapper objectMapper,
            PagePermission pagePermission) {
        this.pluginService = pluginService;
        this.layoutActionService = layoutActionService;
        this.newPageService = newPageService;
        this.responseUtils = responseUtils;
        this.objectMapper = objectMapper;
        this.pagePermission = pagePermission;
    }

    @Override
    public Mono<ActionDTO> importAction(
            Object input, String pageId, String name, String workspaceId, String branchName) {
        ActionDTO action;

        try {
            if (isBlank((String) input)) {
                throw new AppsmithException(AppsmithError.EMPTY_CURL_INPUT_STATEMENT, FieldName.CURL_CODE);
            }
            action = curlToAction((String) input, name);
        } catch (AppsmithException e) {
            return Mono.error(e);
        }

        if (action == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_CURL_COMMAND));
        }

        Mono<NewPage> pageMono = newPageService.findByBranchNameAndDefaultPageId(
                branchName, pageId, pagePermission.getActionCreatePermission());

        // Set the default values for datasource (plugin, name) and then create the action
        // with embedded datasource
        return Mono.zip(Mono.just(action), pluginService.findByPackageName(RESTAPI_PLUGIN), pageMono)
                .flatMap(tuple -> {
                    final ActionDTO action1 = tuple.getT1();
                    final Plugin plugin = tuple.getT2();
                    final NewPage newPage = tuple.getT3();

                    final Datasource datasource = action1.getDatasource();
                    final DatasourceConfiguration datasourceConfiguration = datasource.getDatasourceConfiguration();
                    datasource.setName(datasourceConfiguration.getUrl());
                    datasource.setPluginId(plugin.getId());
                    datasource.setWorkspaceId(workspaceId);
                    // Set git related resource IDs
                    action1.setDefaultResources(newPage.getDefaultResources());
                    action1.setPageId(newPage.getId());
                    return Mono.just(action1);
                })
                .flatMap(action2 -> layoutActionService.createSingleAction(action2, Boolean.FALSE))
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    public ActionDTO curlToAction(String command, String name) throws AppsmithException {
        ActionDTO action = curlToAction(command);
        if (action != null) {
            action.setName(name);
        }
        return action;
    }

    public ActionDTO curlToAction(String command) throws AppsmithException {
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
        boolean isDollarSubshellPossible = false;

        for (int i = 0; i < textLength; ++i) {
            char currentChar = trimmedText.charAt(i);

            if (isDollarSubshellPossible) {
                if (currentChar == CharConstants.OPEN_QUOTE) {
                    throw new AppsmithException(
                            AppsmithError.GENERIC_BAD_REQUEST, "Please do not try to invoke a subshell in the cURL");
                }
            }

            if (quote != null) {
                // We are inside quotes.

                if (isEscaped) {
                    currentToken.append(currentChar);
                    isEscaped = false;

                } else if (currentChar == CharConstants.DOLLAR && quote != CharConstants.SINGLE_QUOTE) {
                    isDollarSubshellPossible = true;

                } else if (currentChar == CharConstants.BACK_TICK && quote != CharConstants.SINGLE_QUOTE) {
                    throw new AppsmithException(
                            AppsmithError.GENERIC_BAD_REQUEST, "Please do not try to invoke a subshell in the cURL");

                } else if (currentChar == CharConstants.BACK_SLASH && quote != CharConstants.SINGLE_QUOTE) {
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
                    if (currentChar != CharConstants.NEW_LINE) {
                        currentToken.append(currentChar);
                    }
                    isEscaped = false;

                } else if (currentChar == CharConstants.DOLLAR) {
                    isDollarSubshellPossible = true;

                } else if (currentChar == CharConstants.BACK_TICK) {
                    throw new AppsmithException(
                            AppsmithError.GENERIC_BAD_REQUEST, "Please do not try to invoke a subshell in the cURL");

                } else if (currentChar == CharConstants.BACK_SLASH) {
                    // This is a backslash that will escape the next character.
                    isEscaped = true;

                } else if (currentChar == CharConstants.NEW_LINE || currentChar == CharConstants.HASH_TAG) {
                    // End of the line or rest is a comment.
                    break;

                } else if (currentChar == CharConstants.SPACE || currentChar == CharConstants.TAB) {
                    // White space lying around between arguments. This delineates tokens.
                    if (!currentToken.isEmpty()) {
                        tokens.add(currentToken.toString());
                        currentToken.setLength(0);
                    }

                } else if (currentChar == CharConstants.DOUBLE_QUOTE || currentChar == CharConstants.SINGLE_QUOTE) {
                    // Start of a quoted token.
                    quote = currentChar;

                } else {
                    currentToken.append(currentChar);
                }
            }
        }

        if (!currentToken.isEmpty()) {
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
            if (ArgConstants.DATA_SHORT.equals(token)
                    || ArgConstants.DATA_ASCII.equals(token)
                    || ArgConstants.DATA_RAW.equals(token)) {
                normalizedTokens.add(ArgConstants.DATA);
            } else if (token.startsWith(ArgConstants.DATA_SHORT)) {
                // `-dstuff` -> `--data stuff`
                normalizedTokens.add(ArgConstants.DATA);
                if (token.length() > 2) {
                    normalizedTokens.add(token.substring(2));
                }
            } else if (ArgConstants.FORM_SHORT.equals(token)) {
                normalizedTokens.add(ArgConstants.FORM);
            } else if (ArgConstants.HEADER_SHORT.equals(token)) {
                normalizedTokens.add(ArgConstants.HEADER);
            } else if (token.startsWith(ArgConstants.HEADER_SHORT)) {
                // `-HContent-Type:application/json` -> `--header Content-Type:application/json`
                normalizedTokens.add(ArgConstants.HEADER);
                if (token.length() > 2) {
                    normalizedTokens.add(token.substring(2));
                }
            } else if (ArgConstants.REQUEST_SHORT.equals(token)) {
                normalizedTokens.add(ArgConstants.REQUEST);
            } else if (token.startsWith(ArgConstants.REQUEST_SHORT)) {
                // `-XGET` -> `--request GET`
                normalizedTokens.add(ArgConstants.REQUEST);
                if (token.length() > 2) {
                    normalizedTokens.add(token.substring(2).toUpperCase());
                }
            } else if (ArgConstants.COOKIE_SHORT.equals(token)) {
                normalizedTokens.add(ArgConstants.COOKIE);
            } else if (ArgConstants.USER_SHORT.equals(token)) {
                normalizedTokens.add(ArgConstants.USER);
            } else if (ArgConstants.USER_AGENT_SHORT.equals(token)) {
                normalizedTokens.add(ArgConstants.USER_AGENT);
            } else if (!ArgConstants.URL.equals(token)) {
                // We skip the `--url` argument since it's superfluous and URLs are directly sniffed out of the argument
                // list. The `--url` argument holds no special significance in cURL.
                normalizedTokens.add(token);
            }
        }

        return normalizedTokens;
    }

    public ActionDTO parse(List<String> tokens) throws AppsmithException {
        // Curl argument parsing as per <https://linux.die.net/man/1/curl>.

        if (tokens.isEmpty() || !"curl".equals(tokens.get(0))) {
            // Doesn't look like a curl command.
            return null;
        }

        final ActionDTO action = new ActionDTO();
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        action.setActionConfiguration(actionConfiguration);

        final Datasource datasource = new Datasource();
        action.setDatasource(datasource);
        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        final List<Property> headers = new ArrayList<>();
        String contentType = null;
        final List<String> dataParts = new ArrayList<>();
        final List<String> formParts = new ArrayList<>();

        String state = null;

        for (int i = 1; i < tokens.size(); ++i) {
            String token = tokens.get(i);
            boolean isStateProcessed = true;

            if (ArgConstants.REQUEST.equals(state)) {
                // HttpMethod now supports custom verbs as well,
                // so we limit our check to non-ASCII characters as the HTTP 1.1 RFC states
                // Ref: https://www.rfc-editor.org/rfc/rfc7231#section-8.1
                if (token == null || !token.chars().allMatch(c -> c < 128)) {
                    throw new AppsmithException(AppsmithError.INVALID_CURL_METHOD, token);
                }
                // The `token` is next to `--request`.
                final HttpMethod method = HttpMethod.valueOf(token.toUpperCase());
                actionConfiguration.setHttpMethod(method);

            } else if (ArgConstants.HEADER.equals(state)) {
                // The `token` is next to `--header`.
                final String[] parts = token.split(":\\s*", 2);
                if (parts.length != 2) {
                    throw new AppsmithException(AppsmithError.INVALID_CURL_HEADER, token);
                }
                if ("content-type".equalsIgnoreCase(parts[0])) {
                    contentType = parts[1];
                    // part[0] is already set to content-type, however, it might not have consistent casing. hence
                    // resetting it to a HTTP standard.
                    parts[0] = HttpHeaders.CONTENT_TYPE;
                    // Setting the apiContentType to the content-type detected in the header with the key word
                    // content-type.
                    // required for RestAPI calls with GET method having body.
                    actionConfiguration.setFormData(Map.of(API_CONTENT_TYPE_KEY, contentType));
                }
                headers.add(new Property(parts[0], parts[1]));

            } else if (ArgConstants.DATA.equals(state)) {
                // The `token` is next to `--data`.
                dataParts.add(token);

            } else if ("--data-urlencode".equals(state)) {
                // The `token` is next to `--data-urlencode`.
                // ignore the '=' at the start as the curl document says
                // https://curl.se/docs/manpage.html#--data-urlencode
                if (token.startsWith("=")) {
                    dataParts.add(token.substring(1));
                } else {
                    dataParts.add(token);
                }

            } else if (ArgConstants.FORM.equals(state)) {
                // The token is next to --form
                formParts.add(token);

            } else if (ArgConstants.COOKIE.equals(state)) {
                // The `token` is next to `--data-cookie`.
                headers.add(new Property("Set-Cookie", token));

            } else if (ArgConstants.USER.equals(state)) {
                // The `token` is next to `--user`.
                headers.add(new Property(
                        "Authorization", "Basic " + Base64.getEncoder().encodeToString(token.getBytes())));

            } else if (ArgConstants.USER_AGENT.equals(state)) {
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

        if (contentType == null) {
            contentType = guessTheContentType(dataParts, formParts);
            if (contentType != null) {
                headers.add(new Property(HttpHeaders.CONTENT_TYPE, contentType));
                // Setting the apiContentType to the content type detected by guessing the elements from  -f/ --form
                // flag or -d/ --data flag
                // required for RestAPI calls with GET method having body.
                actionConfiguration.setFormData(Map.of(API_CONTENT_TYPE_KEY, contentType));
            }
        }

        actionConfiguration.setHeaders(headers);

        if (!dataParts.isEmpty()) {
            if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(contentType)) {
                final ArrayList<Property> formPairs = new ArrayList<>();
                actionConfiguration.setBodyFormData(formPairs);
                for (String part : dataParts) {
                    final String[] parts = part.split("=", 2);
                    formPairs.add(new Property(parts[0], parts.length > 1 ? parts[1] : ""));
                }

            } else {
                actionConfiguration.setBody(StringUtils.join(dataParts, '&'));
            }
        }
        if (!formParts.isEmpty()) {
            if (MediaType.MULTIPART_FORM_DATA_VALUE.equals(contentType)) {
                final ArrayList<Property> formPairs = new ArrayList<>();
                actionConfiguration.setBodyFormData(formPairs);
                for (String part : formParts) {
                    final String[] parts = part.split("=", 2);
                    // Multipart form values are double quoted. Eg: "value"
                    // We trim the quotes from the beginning & end of the string
                    String formValue = (parts.length > 1) ? parts[1].replaceAll("^\"|\"$", "") : "";
                    formPairs.add(new Property(parts[0], formValue));
                }

            } else {
                actionConfiguration.setBody(StringUtils.join(formParts, '&'));
            }
        }

        if (actionConfiguration.getHttpMethod() == null) {
            // Default HTTP method is POST if there is body data to send, else GET.
            actionConfiguration.setHttpMethod(dataParts.isEmpty() ? HttpMethod.GET : HttpMethod.POST);
        }

        return action;
    }

    private String guessTheContentType(List<String> dataParts, List<String> formParts) {
        if (!dataParts.isEmpty()) {
            final String data = dataParts.get(0);
            final Pattern urlEncodedPattern = Pattern.compile(URL_ENCODE_REGEX);

            // if it's form url encoded?
            if (urlEncodedPattern.matcher(data).matches()) {
                return MediaType.APPLICATION_FORM_URLENCODED_VALUE;
            } else {
                // or if it's JSON
                try {
                    objectMapper.readTree(data);
                    return MediaType.APPLICATION_JSON_VALUE;
                } catch (JsonProcessingException e) {
                    // ignore exception it's not JSON
                }
            }
        } else if (!formParts.isEmpty()) {
            return MediaType.MULTIPART_FORM_DATA_VALUE;
        }
        return null;
    }

    private void trySaveURL(ActionDTO action, String token) throws MalformedURLException, URISyntaxException {
        // If the URL appears to not have a protocol set, prepend the `https` protocol.
        if (!token.matches(URL_PROTOCOL_REGEX)) {
            token = HTTP_PROTOCOL_PREFIX + token;
        }

        // If the string doesn't throw an exception when being converted to a URI, its a valid URL.
        URL url = new URL(token);

        String path = url.getPath();
        String base = url.getProtocol() + SCHEME_DELIMITER + url.getHost() + getPort(url);

        log.debug("cURL import URL: '{}', path: '{}' baseUrl: '{}'", url, path, base);

        // Extract query params.
        final ActionConfiguration actionConfiguration = action.getActionConfiguration();
        List<Property> queryParameters = actionConfiguration.getQueryParameters() == null
                ? new ArrayList<>()
                : actionConfiguration.getQueryParameters();
        queryParameters.addAll(getQueryParams(url));
        actionConfiguration.setQueryParameters(queryParameters);

        // Set the URL without the query params & the path.
        action.getDatasource().getDatasourceConfiguration().setUrl(base);

        // Set the path in actionConfiguration.
        actionConfiguration.setPath(path);
    }

    private List<Property> getQueryParams(URL url) {
        List<Property> queryParamsList = new ArrayList<>();
        String queryParamsString = url.getQuery();

        /**
         * Attempt to extract query params only if the query params string is non-empty, and it has at least one key
         * value pair.
         */
        if (!isBlank(queryParamsString) && queryParamsString.contains(CharConstants.EQUAL)) {
            Arrays.stream(queryParamsString.split(CharConstants.AMPERSAND)).forEach(queryParam -> {
                String[] paramMap = queryParam.split(CharConstants.EQUAL, 2);
                if (paramMap.length > 1) {
                    queryParamsList.add(new Property(paramMap[0], paramMap[1]));
                }
            });
        }

        return queryParamsList;
    }

    private String getPort(URL url) {
        if (url.getPort() != -1) {
            return ":" + url.getPort();
        }
        return "";
    }
}
