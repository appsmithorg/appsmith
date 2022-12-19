package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.constants.EnvVariables;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.dtos.TestEmailConfigRequestDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.mail.MessagingException;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_DISABLE_TELEMETRY;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_INSTANCE_NAME;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_ENABLED;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_FROM;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_HOST;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_PASSWORD;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_PORT;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_SMTP_AUTH;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_MAIL_USERNAME;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GITHUB_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GOOGLE_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_RECAPTCHA_SECRET_KEY;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_RECAPTCHA_SITE_KEY;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_REPLY_TO;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SIGNUP_ALLOWED_DOMAINS;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SIGNUP_DISABLED;
import static java.lang.Boolean.TRUE;

@Slf4j
@Getter
public class EnvManagerCEImpl implements EnvManagerCE {

    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final PolicyUtils policyUtils;
    private final EmailSender emailSender;

    private final CommonConfig commonConfig;
    private final EmailConfig emailConfig;
    private final JavaMailSender javaMailSender;
    private final GoogleRecaptchaConfig googleRecaptchaConfig;
    private final FileUtils fileUtils;

    private final PermissionGroupService permissionGroupService;

    private final ConfigService configService;

    private final UserUtils userUtils;

    private final TenantService tenantService;

    private final ObjectMapper objectMapper;

    /**
     * This regex pattern matches environment variable declarations like `VAR_NAME=value` or `VAR_NAME="value"` or just
     * `VAR_NAME=`. It also defines two named capture groups, `name` and `value`, for the variable's name and value
     * respectively.
     */
    private static final Pattern ENV_VARIABLE_PATTERN = Pattern.compile(
            "^(?<name>[A-Z\\d_]+)\\s*=\\s*(?<value>.*)$"
    );

    private static final Set<String> VARIABLE_WHITELIST = Stream.of(EnvVariables.values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    public EnvManagerCEImpl(SessionUserService sessionUserService,
                            UserService userService,
                            AnalyticsService analyticsService,
                            UserRepository userRepository,
                            PolicyUtils policyUtils,
                            EmailSender emailSender,
                            CommonConfig commonConfig,
                            EmailConfig emailConfig,
                            JavaMailSender javaMailSender,
                            GoogleRecaptchaConfig googleRecaptchaConfig,
                            FileUtils fileUtils,
                            PermissionGroupService permissionGroupService,
                            ConfigService configService,
                            UserUtils userUtils,
                            TenantService tenantService,
                            ObjectMapper objectMapper) {

        this.sessionUserService = sessionUserService;
        this.userService = userService;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
        this.policyUtils = policyUtils;
        this.emailSender = emailSender;
        this.commonConfig = commonConfig;
        this.emailConfig = emailConfig;
        this.javaMailSender = javaMailSender;
        this.googleRecaptchaConfig = googleRecaptchaConfig;
        this.fileUtils = fileUtils;
        this.permissionGroupService = permissionGroupService;
        this.configService = configService;
        this.userUtils = userUtils;
        this.tenantService = tenantService;
        this.objectMapper = objectMapper;
    }

    /**
     * Updates values of variables in the envContent string, based on the changes map given. This function **only**
     * updates values of variables that already defined in envContent. It NEVER adds new env variables to it. This is so
     * a malicious request won't insert new dubious env variables.
     *
     * @param envContent String content of an env file.
     * @param changes    A map with variable name to new value.
     * @return List of string lines for updated env file content.
     */
    @Override
    public List<String> transformEnvContent(String envContent, Map<String, String> changes) {
        final Set<String> variablesNotInWhitelist = new HashSet<>(changes.keySet());
        final Set<String> tenantConfigWhitelist = allowedTenantConfiguration();

        // We remove all the variables that aren't defined in our env variable whitelist or in the TenantConfiguration
        // class. This is because the configuration can be saved either in the .env file or the tenant collection
        variablesNotInWhitelist.removeAll(VARIABLE_WHITELIST);
        variablesNotInWhitelist.removeAll(tenantConfigWhitelist);

        if (!variablesNotInWhitelist.isEmpty()) {
            throw new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST);
        }

        if (changes.containsKey(APPSMITH_MAIL_HOST.name())) {
            changes.put(
                    APPSMITH_MAIL_ENABLED.name(),
                    Boolean.toString(StringUtils.hasText(changes.get(APPSMITH_MAIL_HOST.name())))
            );
        }

        if (changes.containsKey(APPSMITH_MAIL_USERNAME.name())) {
            changes.put(
                    APPSMITH_MAIL_SMTP_AUTH.name(),
                    Boolean.toString(StringUtils.hasText(changes.get(APPSMITH_MAIL_USERNAME.name())))
            );
        }

        final Set<String> remainingChangedNames = new HashSet<>(changes.keySet());

        final List<String> outLines = envContent.lines()
                .map(line -> {
                    final Matcher matcher = ENV_VARIABLE_PATTERN.matcher(line);
                    if (!matcher.matches()) {
                        return line;
                    }
                    final String name = matcher.group("name");
                    return remainingChangedNames.remove(name)
                            ? String.format("%s=%s", name, escapeForShell(changes.get(name)))
                            : line;
                })
                .collect(Collectors.toList());

        for (final String name : remainingChangedNames) {
            outLines.add(name + "=" + escapeForShell(changes.get(name)));
        }

        return outLines;
    }

    private String escapeForShell(String input) {
        if (org.apache.commons.lang3.StringUtils.containsAny(input, " ?*#'")) {
            return ("'" + input.replace("'", "'\"'\"'") + "'")
                    .replaceAll("^''", "")
                    .replaceAll("''$", "");
        }

        return input;
    }

    private String unescapeFromShell(String input) {
        final int len = input.length();
        final StringBuilder valueBuilder = new StringBuilder();
        Character inQuote = null;

        for (int i = 0; i < len; ++i) {
            final char c = input.charAt(i);

            if (inQuote != null && inQuote == '\'') {
                if (c == '\'') {
                    inQuote = null;
                } else {
                    valueBuilder.append(c);
                }

            } else if (inQuote != null) {
                // If `inQuote` is not null here, then it can only be the double-quote character.
                // We don't do variable interpolation here, since we don't expect it to be present in the env file.
                if (c == '"') {
                    inQuote = null;
                } else {
                    valueBuilder.append(c);
                }

            } else if (c == '\'' || c == '"') {
                inQuote = c;

            } else {
                valueBuilder.append(c);

            }
        }

        return valueBuilder.toString();
    }

    private Mono<Void> validateChanges(User user, Map<String, String> changes) {
        if (changes.containsKey(APPSMITH_ADMIN_EMAILS.name())) {
            String emailCsv = StringUtils.trimAllWhitespace(changes.get(APPSMITH_ADMIN_EMAILS.name()));

            // validate input is in the format email,email,email and is not empty
            if (!ValidationUtils.validateEmailCsv(emailCsv)) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Admin Emails"));
            } else { // make sure user is not removing own email
                Set<String> adminEmails = TextUtils.csvToSet(emailCsv);
                if (!adminEmails.contains(user.getEmail())) { // user can not remove own email address
                    return Mono.error(new AppsmithException(
                            AppsmithError.GENERIC_BAD_REQUEST, "Removing own email from Admin Email is not allowed"
                    ));
                }
            }
        }
        return Mono.empty();
    }

    /**
     * This function returns a set of String based on the JsonProperty annotations in the TenantConfiguration class
     *
     * @return
     */
    private Set<String> allowedTenantConfiguration() {
        Field[] fields = TenantConfiguration.class.getDeclaredFields();
        return Arrays.stream(fields)
                .map(field -> {
                    JsonProperty jsonProperty = field.getDeclaredAnnotation(JsonProperty.class);
                    return jsonProperty == null ? field.getName() : jsonProperty.value();
                }).collect(Collectors.toSet());
    }

    /**
     * This function sets the value in the TenantConfiguration object based on the JsonProperty annotation of the field
     * The key must be exactly equal to the json annotation
     *
     * @param tenantConfiguration
     * @param key
     * @param value
     */
    private void setConfigurationByKey(TenantConfiguration tenantConfiguration, String key, String value) {
        Field[] fields = tenantConfiguration.getClass().getDeclaredFields();
        for (Field field : fields) {
            JsonProperty jsonProperty = field.getDeclaredAnnotation(JsonProperty.class);
            if (jsonProperty != null && jsonProperty.value().equals(key)) {
                try {
                    field.setAccessible(true);
                    field.set(tenantConfiguration, value);
                } catch (IllegalAccessException e) {
                    // Catch the error, log it and then do nothing.
                    log.error("Got error while parsing the JSON annotations from TenantConfiguration class. Cause: ", e);
                }
            }
        }
    }


    private Mono<Tenant> updateTenantConfiguration(String tenantId, Map<String, String> changes) {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        // Write the changes to the tenant collection in configuration field
        return Flux.fromIterable(changes.entrySet())
                .map(map -> {
                    String key = map.getKey();
                    String value = map.getValue();
                    setConfigurationByKey(tenantConfiguration, key, value);
                    return map;
                })
                .then(Mono.just(tenantConfiguration))
                .flatMap(updatedTenantConfig -> tenantService.updateTenantConfiguration(tenantId, tenantConfiguration));
    }

    @Override
    public Mono<EnvChangesResponseDTO> applyChanges(Map<String, String> changes) {
        // This flow is pertinent for any variables that need to change in the .env file or be saved in the tenant configuration
        return verifyCurrentUserIsSuper().
                flatMap(user -> validateChanges(user, changes).thenReturn(user))
                .flatMap(user -> {
                    // Write the changes to the env file.
                    final String originalContent;
                    final Path envFilePath = Path.of(commonConfig.getEnvFilePath());

                    try {
                        originalContent = Files.readString(envFilePath);
                    } catch (IOException e) {
                        log.error("Unable to read env file " + envFilePath, e);
                        return Mono.error(e);
                    }
                    Map<String, String> originalVariables = parseToMap(originalContent);

                    final Map<String, String> envFileChanges = new HashMap<>(changes);
                    final Set<String> tenantConfigurationKeys = allowedTenantConfiguration();
                    for (final String key : changes.keySet()) {
                        if (tenantConfigurationKeys.contains(key)) {
                            envFileChanges.remove(key);
                        }
                    }
                    final List<String> changedContent = transformEnvContent(originalContent, envFileChanges);

                    try {
                        Files.write(envFilePath, changedContent);
                    } catch (IOException e) {
                        log.error("Unable to write to env file " + envFilePath, e);
                        return Mono.error(e);
                    }

                    // For configuration variables, save the variables to the config collection instead of .env file
                    // We ideally want to migrate all variables from .env file to the config collection for better scalability
                    // Write the changes to the tenant collection in configuration field
                    return updateTenantConfiguration(user.getTenantId(), changes)
                            .then(sendAnalyticsEvent(user, originalVariables, changes))
                            .thenReturn(originalVariables);
                })
                .flatMap(originalValues -> {
                    Mono<Void> dependentTasks = Mono.empty();

                    // Try and update any at runtime, that can be.
                    final Map<String, String> changesCopy = new HashMap<>(changes);

                    if (changesCopy.containsKey(APPSMITH_INSTANCE_NAME.name())) {
                        commonConfig.setInstanceName(changesCopy.remove(APPSMITH_INSTANCE_NAME.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_SIGNUP_DISABLED.name())) {
                        commonConfig.setSignupDisabled(changesCopy.remove(APPSMITH_SIGNUP_DISABLED.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_SIGNUP_ALLOWED_DOMAINS.name())) {
                        commonConfig.setAllowedDomainsString(changesCopy.remove(APPSMITH_SIGNUP_ALLOWED_DOMAINS.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_ADMIN_EMAILS.name())) {
                        commonConfig.setAdminEmails(changesCopy.remove(APPSMITH_ADMIN_EMAILS.name()));
                        String oldAdminEmailsCsv = originalValues.get(APPSMITH_ADMIN_EMAILS.name());
                        dependentTasks = dependentTasks.then(updateAdminUserPolicies(oldAdminEmailsCsv)).then();
                    }

                    if (changesCopy.containsKey(APPSMITH_MAIL_FROM.name())) {
                        emailConfig.setMailFrom(changesCopy.remove(APPSMITH_MAIL_FROM.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_REPLY_TO.name())) {
                        emailConfig.setReplyTo(changesCopy.remove(APPSMITH_REPLY_TO.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_MAIL_ENABLED.name())) {
                        emailConfig.setEmailEnabled("true".equals(changesCopy.remove(APPSMITH_MAIL_ENABLED.name())));
                    }

                    if (changesCopy.containsKey(APPSMITH_MAIL_SMTP_AUTH.name())) {
                        emailConfig.setEmailEnabled("true".equals(changesCopy.remove(APPSMITH_MAIL_SMTP_AUTH.name())));
                    }

                    if (javaMailSender instanceof JavaMailSenderImpl) {
                        JavaMailSenderImpl javaMailSenderImpl = (JavaMailSenderImpl) javaMailSender;
                        if (changesCopy.containsKey(APPSMITH_MAIL_HOST.name())) {
                            javaMailSenderImpl.setHost(changesCopy.remove(APPSMITH_MAIL_HOST.name()));
                        }
                        if (changesCopy.containsKey(APPSMITH_MAIL_PORT.name())) {
                            javaMailSenderImpl.setPort(Integer.parseInt(changesCopy.remove(APPSMITH_MAIL_PORT.name())));
                        }
                        if (changesCopy.containsKey(APPSMITH_MAIL_USERNAME.name())) {
                            javaMailSenderImpl.setUsername(changesCopy.remove(APPSMITH_MAIL_USERNAME.name()));
                        }
                        if (changesCopy.containsKey(APPSMITH_MAIL_PASSWORD.name())) {
                            javaMailSenderImpl.setPassword(changesCopy.remove(APPSMITH_MAIL_PASSWORD.name()));
                        }
                    }

                    if (changesCopy.containsKey(APPSMITH_RECAPTCHA_SITE_KEY.name())) {
                        googleRecaptchaConfig.setSiteKey(changesCopy.remove(APPSMITH_RECAPTCHA_SITE_KEY.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_RECAPTCHA_SECRET_KEY.name())) {
                        googleRecaptchaConfig.setSecretKey(changesCopy.remove(APPSMITH_RECAPTCHA_SECRET_KEY.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_DISABLE_TELEMETRY.name())) {
                        commonConfig.setTelemetryDisabled("true".equals(changesCopy.remove(APPSMITH_DISABLE_TELEMETRY.name())));
                    }

                    return dependentTasks.thenReturn(new EnvChangesResponseDTO(true));
                });
    }

    @Override
    public Mono<EnvChangesResponseDTO> applyChangesFromMultipartFormData(MultiValueMap<String, Part> formData) {
        return Flux.fromIterable(formData.entrySet())
                .flatMap(entry -> {
                    final String key = entry.getKey();
                    final List<Part> parts = entry.getValue();
                    final boolean isFile = parts.size() > 0 && parts.get(0) instanceof FilePart;

                    if (isFile) {
                        return handleFileUpload(key, parts);
                    }

                    return DataBufferUtils
                            .join(Flux.fromIterable(parts).flatMapSequential(Part::content))
                            .flatMap(dataBuffer -> {
                                final byte[] content;
                                try (InputStream inputStream = dataBuffer.asInputStream(true)) {
                                    content = inputStream.readAllBytes();
                                } catch (IOException e) {
                                    log.error("Unable to read multipart form data, in env change API", e);
                                    return Mono.error(new AppsmithException(AppsmithError.IO_ERROR, "unable to read data"));
                                }
                                return Mono.just(Map.entry(key, new String(content, StandardCharsets.UTF_8)));
                            });
                })
                .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                .flatMap(this::applyChanges);
    }

    @Override
    @NotNull
    public Mono<Map.Entry<String, String>> handleFileUpload(String key, List<Part> parts) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION, "File upload is not supported"));
    }

    /**
     * Sends analytics events after an admin setting update.
     *
     * @param user              The user who triggered the event.
     * @param originalVariables Already existing env variables
     * @param changes           Changes in the env variables
     * @return Mono of User
     */
    private Mono<Void> sendAnalyticsEvent(User user, Map<String, String> originalVariables, Map<String, String> changes) {
        // Generate analytics event properties template(s) according to the env variable changes
        List<Map<String, Object>> analyticsEvents = getAnalyticsEvents(originalVariables, changes, new ArrayList<>());

        // Currently supporting only one authentication method update in one env update call
        if (!analyticsEvents.isEmpty()) {
            return analyticsService.sendObjectEvent(AnalyticsEvents.AUTHENTICATION_METHOD_CONFIGURATION, user, analyticsEvents.get(0)).then();
        }
        // We cannot send sensitive information present as values in env to the analytics
        // Values are filtered and only variable names are sent
        Map<String, Object> analyticsProperties = Map.of(FieldName.UPDATED_INSTANCE_SETTINGS, changes.keySet());
        // A general INSTANCE_SETTING_UPDATED event is also sent for all admin settings changes other than Authentication method added/removed event
        return analyticsService.sendObjectEvent(AnalyticsEvents.INSTANCE_SETTING_UPDATED, user, analyticsProperties).then();
    }

    /**
     * Generates analytics event properties template(s) according to the env variable changes.
     *
     * @param originalVariables Already existing env variables
     * @param changes           Changes in the env variables
     * @param extraAuthEnvs     To incorporate extra authentication methods in enterprise edition
     * @return A list of analytics event properties mappings.
     */
    public List<Map<String, Object>> getAnalyticsEvents(Map<String, String> originalVariables, Map<String, String> changes, List<String> extraAuthEnvs) {
        List<String> authEnvs = new ArrayList<>(List.of(APPSMITH_OAUTH2_GOOGLE_CLIENT_ID.name(), APPSMITH_OAUTH2_GITHUB_CLIENT_ID.name()));

        // Add extra authentication methods
        authEnvs.addAll(extraAuthEnvs);

        // Generate analytics event(s) properties
        List<Map<String, Object>> analyticsEvents = new ArrayList<>();
        for (String authEnv : authEnvs) {
            if (changes.containsKey(authEnv)) {
                Map<String, Object> properties = new HashMap<>();
                properties.put("provider", authEnv);
                setAnalyticsEventAction(properties, changes.get(authEnv), originalVariables.get(authEnv), authEnv);
                if (properties.containsKey("action")) {
                    analyticsEvents.add(properties);
                }
            }
        }

        return analyticsEvents;
    }

    /**
     * Sets the correct action to analytics event properties template(s) according to the env variable changes
     *
     * @param properties       Properties map into which event details will be populated. **This is mutated**.
     * @param newVariable      Updated env variable value
     * @param originalVariable Already existing env variable value
     * @param authEnv          Env variable name
     */
    @Override
    public void setAnalyticsEventAction(Map<String, Object> properties, String newVariable, String originalVariable, String authEnv) {
        // Authentication configuration added
        if (!newVariable.isEmpty() && (originalVariable == null || originalVariable.isEmpty())) {
            properties.put("action", "Added");
        }
        // Authentication configuration removed
        else if (newVariable.isEmpty() && !originalVariable.isEmpty()) {
            properties.put("action", "Removed");
        }
    }

    /**
     * Adds or removes admin user policy from users.
     * If an email is removed from admin emails, it'll remove the policy from that user.
     * If a new email is added as admin email, it'll add the policy to that user
     *
     * @param oldAdminEmailsCsv comma separated email addresses that was set as admin email earlier
     */
    private Mono<Boolean> updateAdminUserPolicies(String oldAdminEmailsCsv) {
        Set<String> oldAdminEmails = TextUtils.csvToSet(oldAdminEmailsCsv);
        Set<String> newAdminEmails = commonConfig.getAdminEmails();

        // we need to find out the removed emails and new emails
        Set<String> removedUsers = new HashSet<>(oldAdminEmails);
        removedUsers.removeAll(newAdminEmails);
        Set<String> newUsers = new HashSet<>(newAdminEmails);
        newUsers.removeAll(oldAdminEmails);

        Mono<Boolean> removedUsersMono = Flux.fromIterable(removedUsers).flatMap(userService::findByEmail)
                .collectList()
                .flatMap(users -> userUtils.removeSuperUser(users));

        Mono<Boolean> newUsersMono = Flux.fromIterable(newUsers).flatMap(userService::findByEmail)
                .collectList()
                .flatMap(users -> userUtils.makeSuperUser(users));

        return Mono.when(removedUsersMono, newUsersMono)
                .then(Mono.just(TRUE));
    }

    @Override
    public Map<String, String> parseToMap(String content) {
        final Map<String, String> data = new HashMap<>();

        content.lines()
                .forEach(line -> {
                    final Matcher matcher = ENV_VARIABLE_PATTERN.matcher(line);
                    if (matcher.matches()) {
                        final String name = matcher.group("name");
                        if (VARIABLE_WHITELIST.contains(name)) {
                            data.put(name, unescapeFromShell(matcher.group("value")));
                        }
                    }
                });

        return data;
    }

    @Override
    public Mono<Map<String, String>> getAll() {
        return verifyCurrentUserIsSuper()
                .flatMap(user -> {
                    final String originalContent;
                    try {
                        originalContent = Files.readString(Path.of(commonConfig.getEnvFilePath()));
                    } catch (NoSuchFileException e) {
                        return Mono.error(new AppsmithException(AppsmithError.ENV_FILE_NOT_FOUND));
                    } catch (IOException e) {
                        log.error("Unable to read env file " + commonConfig.getEnvFilePath(), e);
                        return Mono.error(e);
                    }

                    // set the default values to response
                    Map<String, String> envKeyValueMap = parseToMap(originalContent);

                    if (!envKeyValueMap.containsKey(APPSMITH_INSTANCE_NAME.name())) {
                        // no APPSMITH_INSTANCE_NAME set in env file, set the default value
                        envKeyValueMap.put(APPSMITH_INSTANCE_NAME.name(), commonConfig.getInstanceName());
                    }

                    return Mono.justOrEmpty(envKeyValueMap);
                });
    }

  /**
   * A filter function on getAll that returns env variables which are having non-empty values
   */
    @Override
    public Mono<Map<String, String>> getAllNonEmpty() {
        return getAll().flatMap(map -> {
              Map<String, String> nonEmptyValuesMap = new HashMap<>();
              for (Map.Entry<String, String> entry: map.entrySet()) {
                  if (StringUtils.hasText(entry.getValue())) {
                      nonEmptyValuesMap.put(entry.getKey(), entry.getValue());
                  }
              }
              return Mono.just(nonEmptyValuesMap);
        });
    }

    @Override
    public Mono<User> verifyCurrentUserIsSuper() {

        return userUtils.isCurrentUserSuperUser()
                .flatMap(isSuperUser -> {
                    if (isSuperUser) {
                        return sessionUserService.getCurrentUser();
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }
                });
    }

    @Override
    public Mono<Void> restart() {
        return verifyCurrentUserIsSuper()
                .flatMap(user -> {
                    log.warn("Initiating restart via supervisor.");
                    try {
                        Runtime.getRuntime().exec(new String[]{
                                "supervisorctl",
                                "restart",
                                "backend",
                                "editor",
                                "rts",
                        });
                    } catch (IOException e) {
                        log.error("Error invoking supervisorctl to restart.", e);
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }
                    return Mono.empty();
                });
    }

    @Override
    public Mono<Boolean> sendTestEmail(TestEmailConfigRequestDTO requestDTO) {
        return verifyCurrentUserIsSuper()
                .flatMap(user -> {
                    JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
                    mailSender.setHost(requestDTO.getSmtpHost());
                    mailSender.setPort(requestDTO.getSmtpPort());

                    Properties props = mailSender.getJavaMailProperties();
                    props.put("mail.transport.protocol", "smtp");
                    props.put("mail.smtp.starttls.enable", "true");
                    props.put("mail.smtp.timeout", 7000); // 7 seconds

                    if (StringUtils.hasLength(requestDTO.getUsername())) {
                        props.put("mail.smtp.auth", "true");
                        mailSender.setUsername(requestDTO.getUsername());
                        mailSender.setPassword(requestDTO.getPassword());
                    } else {
                        props.put("mail.smtp.auth", "false");
                    }
                    props.put("mail.debug", "true");

                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(requestDTO.getFromEmail());
                    message.setTo(user.getEmail());
                    message.setSubject("Test email from Appsmith");
                    message.setText("This is a test email from Appsmith, initiated from Admin Settings page. If you are seeing this, your email configuration is working!\n");

                    try {
                        mailSender.testConnection();
                    } catch (MessagingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, e.getMessage().trim()));
                    }

                    try {
                        mailSender.send(message);
                    } catch (MailException mailException) {
                        log.error("failed to send test email", mailException);
                        return Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, mailException.getMessage()));
                    }
                    return Mono.just(TRUE);
                });
    }

    @Override
    public Mono<Void> download(ServerWebExchange exchange) {
        return verifyCurrentUserIsSuper()
                .flatMap(user -> {
                    try {
                        File envFile = Path.of(commonConfig.getEnvFilePath()).toFile();
                        FileInputStream envFileInputStream = new FileInputStream(envFile);
                        InputStream resourceFile = new ClassPathResource("docker-compose.yml").getInputStream();
                        byte[] byteArray = fileUtils.createZip(
                                new FileUtils.ZipSourceFile(envFileInputStream, "stacks/configuration/docker.env"),
                                new FileUtils.ZipSourceFile(resourceFile, "docker-compose.yml")
                        );
                        final ServerHttpResponse response = exchange.getResponse();
                        response.setStatusCode(HttpStatus.OK);
                        response.getHeaders().set(HttpHeaders.CONTENT_TYPE, "application/zip");
                        response.getHeaders().set("Content-Disposition", "attachment; filename=\"appsmith-config.zip\"");
                        return response.writeWith(Mono.just(new DefaultDataBufferFactory().wrap(byteArray)));
                    } catch (IOException e) {
                        log.error("failed to generate zip file", e);
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }
                });
    }

}
