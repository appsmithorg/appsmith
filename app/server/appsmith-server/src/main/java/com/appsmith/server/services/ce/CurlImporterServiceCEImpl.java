package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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

    private static final String RESTAPI_PLUGIN = "restapi-plugin";

    private static final String ARG_DATA = "--data";
    private static final String ARG_FORM = "--form";
    private static final String ARG_HEADER = "--header";
    private static final String ARG_REQUEST = "--request";
    private static final String ARG_COOKIE = "--cookie";
    private static final String ARG_USER = "--user";
    private static final String ARG_USER_AGENT = "--user-agent";
    private static final String API_CONTENT_TYPE_KEY = "apiContentType";

    private final PluginService pluginService;
    private final LayoutActionService layoutActionService;
    private final NewPageService newPageService;
    private final ObjectMapper objectMapper;
    private final PagePermission pagePermission;

    public CurlImporterServiceCEImpl(
            PluginService pluginService,
            LayoutActionService layoutActionService,
            NewPageService newPageService,
            ObjectMapper objectMapper,
            PagePermission pagePermission) {
        this.pluginService = pluginService;
        this.layoutActionService = layoutActionService;
        this.newPageService = newPageService;
        this.objectMapper = objectMapper;
        this.pagePermission = pagePermission;
    }

    @Override
    public Mono<ActionDTO> importAction(
            Object input, CreatorContextType contextType, String branchedContextId, String name, String workspaceId) {
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

        // Set the default values for datasource (plugin, name) and then create the action
        // with embedded datasource
        return Mono.zip(Mono.just(action), pluginService.findByPackageName(RESTAPI_PLUGIN))
                .flatMap(tuple -> {
                    final ActionDTO action1 = tuple.getT1();
                    final Plugin plugin = tuple.getT2();

                    final Datasource datasource = action1.getDatasource();
                    final DatasourceConfiguration datasourceConfiguration = datasource.getDatasourceConfiguration();
                    datasource.setName(datasourceConfiguration.getUrl());
                    datasource.setPluginId(plugin.getId());
                    datasource.setWorkspaceId(workspaceId);
                    return associateContextIdToActionDTO(action1, contextType, branchedContextId);
                })
                .flatMap(action2 -> layoutActionService.createSingleAction(action2));
    }

    protected Mono<String> getBranchedContextId(CreatorContextType contextType, String contextId, String branchName) {
        return newPageService
                .findByBranchNameAndBasePageId(
                        branchName, contextId, pagePermission.getActionCreatePermission(), List.of(NewPage.Fields.id))
                .map(NewPage::getId);
    }

    protected Mono<ActionDTO> associateContextIdToActionDTO(
            ActionDTO actionDTO, CreatorContextType contextType, String contextId) {
        actionDTO.setPageId(contextId);
        return Mono.just(actionDTO);
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
                if (currentChar == '(') {
                    throw new AppsmithException(
                            AppsmithError.GENERIC_BAD_REQUEST, "Please do not try to invoke a subshell in the cURL");
                }
            }

            if (quote != null) {
                // We are inside quotes.

                if (isEscaped) {
                    currentToken.append(currentChar);
                    isEscaped = false;

                } else if (currentChar == '$' && quote != '\'') {
                    isDollarSubshellPossible = true;

                } else if (currentChar == '`' && quote != '\'') {
                    throw new AppsmithException(
                            AppsmithError.GENERIC_BAD_REQUEST, "Please do not try to invoke a subshell in the cURL");

                } else if (currentChar == '\\' && quote != '\'') {
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

                } else if (currentChar == '$') {
                    isDollarSubshellPossible = true;

                } else if (currentChar == '`') {
                    throw new AppsmithException(
                            AppsmithError.GENERIC_BAD_REQUEST, "Please do not try to invoke a subshell in the cURL");

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
            if ("-d".equals(token) || "--data-ascii".equals(token) || "--data-raw".equals(token)) {
                normalizedTokens.add(ARG_DATA);

            } else if (token.startsWith("-d")) {
                // `-dstuff` -> `--data stuff`
                normalizedTokens.add(ARG_DATA);
                if (token.length() > 2) {
                    normalizedTokens.add(token.substring(2));
                }

            } else if ("-F".equals(token)) {
                normalizedTokens.add(ARG_FORM);

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

            if (ARG_REQUEST.equals(state)) {
                // HttpMethod now supports custom verbs as well,
                // so we limit our check to non-ASCII characters as the HTTP 1.1 RFC states
                // Ref: https://www.rfc-editor.org/rfc/rfc7231#section-8.1
                if (token == null || !token.chars().allMatch(c -> c < 128)) {
                    throw new AppsmithException(AppsmithError.INVALID_CURL_METHOD, token);
                }
                // The `token` is next to `--request`.
                final HttpMethod method = HttpMethod.valueOf(token.toUpperCase());
                actionConfiguration.setHttpMethod(method);

            } else if (ARG_HEADER.equals(state)) {
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

            } else if (ARG_DATA.equals(state)) {
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

            } else if (ARG_FORM.equals(state)) {
                // The token is next to --form
                formParts.add(token);

            } else if (ARG_COOKIE.equals(state)) {
                // The `token` is next to `--data-cookie`.
                headers.add(new Property("Set-Cookie", token));

            } else if (ARG_USER.equals(state)) {
                // The `token` is next to `--user`.
                headers.add(new Property(
                        "Authorization", "Basic " + Base64.getEncoder().encodeToString(token.getBytes())));

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
            final Pattern urlEncodedPattern = Pattern.compile("([A-Za-z0-9%._\\-/]+=[^\\s]+)");
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
        if (!token.matches("\\w+://.*")) {
            token = "http://" + token;
        }

        // If the string doesn't throw an exception when being converted to a URI, its a valid URL.
        URL url = new URL(token);

        String path = url.getPath();
        String base = url.getProtocol() + "://" + url.getHost() + getPort(url);

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
        if (!isBlank(queryParamsString) && queryParamsString.contains("=")) {
            Arrays.stream(queryParamsString.split("&")).forEach(queryParam -> {
                String[] paramMap = queryParam.split("=", 2);
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
