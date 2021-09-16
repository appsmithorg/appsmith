package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class EnvManager {

    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final PolicyUtils policyUtils;
    private final EmailSender emailSender;

    private final CommonConfig commonConfig;
    private final EmailConfig emailConfig;
    private final JavaMailSender javaMailSender;

    /**
     * This regex pattern matches environment variable declarations like `VAR_NAME=value` or `VAR_NAME="value"` or just
     * `VAR_NAME=`. It also defines two named capture groups, `name` and `value`, for the variable's name and value
     * respectively.
     */
    private static final Pattern ENV_VARIABLE_PATTERN = Pattern.compile(
            "^(?<name>[A-Z0-9_]+)\\s*=\\s*\"?(?<value>.*?)\"?$"
    );

    private static final Set<String> VARIABLE_WHITELIST = Set.of(
            "APPSMITH_INSTANCE_NAME",
            "APPSMITH_MONGODB_URI",
            "APPSMITH_REDIS_URL",
            "APPSMITH_MAIL_ENABLED",
            "APPSMITH_MAIL_FROM",
            "APPSMITH_REPLY_TO",
            "APPSMITH_MAIL_HOST",
            "APPSMITH_MAIL_PORT",
            "APPSMITH_MAIL_USERNAME",
            "APPSMITH_MAIL_PASSWORD",
            "APPSMITH_MAIL_SMTP_TLS_ENABLED",
            "APPSMITH_SIGNUP_DISABLED",
            "APPSMITH_SIGNUP_ALLOWED_DOMAINS",
            "APPSMITH_ADMIN_EMAILS",
            "APPSMITH_RECAPTCHA_SITE_KEY",
            "APPSMITH_RECAPTCHA_SECRET_KEY",
            "APPSMITH_GOOGLE_MAPS_API_KEY",
            "APPSMITH_DISABLE_TELEMETRY",
            "APPSMITH_OAUTH2_GOOGLE_CLIENT_ID",
            "APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET",
            "APPSMITH_OAUTH2_GITHUB_CLIENT_ID",
            "APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET"
    );

    /**
     * Updates values of variables in the envContent string, based on the changes map given. This function **only**
     * updates values of variables that already defined in envContent. It NEVER adds new env variables to it. This is so
     * a malicious request won't insert new dubious env variables.
     * @param envContent String content of an env file.
     * @param changes A map with variable name to new value.
     * @return List of string lines for updated env file content.
     */
    public static List<String> transformEnvContent(String envContent, Map<String, String> changes) {
        final Set<String> variablesNotInWhitelist = new HashSet<>(changes.keySet());
        variablesNotInWhitelist.removeAll(VARIABLE_WHITELIST);

        if (!variablesNotInWhitelist.isEmpty()) {
            throw new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS);
        }

        if (changes.containsKey("APPSMITH_MAIL_HOST")) {
            changes.put("APPSMITH_MAIL_ENABLED", Boolean.toString(StringUtils.isNotEmpty(changes.get("APPSMITH_MAIL_HOST"))));
        }

        if (changes.containsKey("APPSMITH_MAIL_USERNAME")) {
            changes.put("APPSMITH_MAIL_SMTP_AUTH", Boolean.toString(StringUtils.isNotEmpty(changes.get("APPSMITH_MAIL_USERNAME"))));
        }

        final Set<String> remainingChangedNames = new HashSet<>(changes.keySet());

        final List<String> outLines = envContent.lines()
                .map(line -> {
                    final Matcher matcher = ENV_VARIABLE_PATTERN.matcher(line);
                    if (!matcher.matches()) {
                        return line;
                    }
                    final String name = matcher.group("name");
                    if (!changes.containsKey(name)) {
                        return line;
                    }
                    remainingChangedNames.remove(name);
                    return line.substring(0, matcher.start("value"))
                                    + changes.get(name)
                                    + line.substring(matcher.end("value"));
                })
                .collect(Collectors.toList());

        for (final String name : remainingChangedNames) {
            outLines.add(name + "=" + changes.get(name));
        }

        return outLines;
    }

    public Mono<EnvChangesResponseDTO> applyChanges(Map<String, String> changes) {
        return verifyCurrentUserIsSuper()
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

                    final List<String> changedContent = transformEnvContent(originalContent, changes);

                    try {
                        Files.write(envFilePath, changedContent);
                    } catch (IOException e) {
                        log.error("Unable to write to env file " + envFilePath, e);
                        return Mono.error(e);
                    }

                    return Mono.just(user);
                })
                .flatMap(user -> {
                    // Try and update any at runtime, that can be.
                    final Map<String, String> changesCopy = new HashMap<>(changes);

                    if (changesCopy.containsKey("APPSMITH_INSTANCE_NAME")) {
                        commonConfig.setInstanceName(changesCopy.remove("APPSMITH_INSTANCE_NAME"));
                    }

                    if (changesCopy.containsKey("APPSMITH_MAIL_FROM")) {
                        emailConfig.setMailFrom(changesCopy.remove("APPSMITH_MAIL_FROM"));
                    }

                    if (changesCopy.containsKey("APPSMITH_REPLY_TO")) {
                        emailConfig.setReplyTo(changesCopy.remove("APPSMITH_REPLY_TO"));
                    }

                    if (changesCopy.containsKey("APPSMITH_MAIL_ENABLED")) {
                        emailConfig.setEmailEnabled("true".equals(changesCopy.remove("APPSMITH_MAIL_ENABLED")));
                    }

                    if (changesCopy.containsKey("APPSMITH_MAIL_SMTP_AUTH")) {
                        emailConfig.setEmailEnabled("true".equals(changesCopy.remove("APPSMITH_MAIL_SMTP_AUTH")));
                    }

                    if (javaMailSender instanceof JavaMailSenderImpl) {
                        JavaMailSenderImpl javaMailSenderImpl = (JavaMailSenderImpl) javaMailSender;
                        if (changesCopy.containsKey("APPSMITH_MAIL_HOST")) {
                            javaMailSenderImpl.setHost(changesCopy.remove("APPSMITH_MAIL_HOST"));
                        }
                        if (changesCopy.containsKey("APPSMITH_MAIL_PORT")) {
                            javaMailSenderImpl.setPort(Integer.parseInt(changesCopy.remove("APPSMITH_MAIL_PORT")));
                        }
                        if (changesCopy.containsKey("APPSMITH_MAIL_USERNAME")) {
                            javaMailSenderImpl.setUsername(changesCopy.remove("APPSMITH_MAIL_USERNAME"));
                        }
                        if (changesCopy.containsKey("APPSMITH_MAIL_PASSWORD")) {
                            javaMailSenderImpl.setPassword(changesCopy.remove("APPSMITH_MAIL_PASSWORD"));
                        }
                    }

                    // If `changesCopy` is not empty here, then we need a restart.
                    return Mono.just(new EnvChangesResponseDTO(!changesCopy.isEmpty()));
                });
    }

    public static Map<String, String> parseToMap(String content) {
        final Map<String, String> data = new HashMap<>();

        content.lines()
                .forEach(line -> {
                    final Matcher matcher = ENV_VARIABLE_PATTERN.matcher(line);
                    if (matcher.matches()) {
                        final String name = matcher.group("name");
                        if (VARIABLE_WHITELIST.contains(name)) {
                            data.put(name, matcher.group("value"));
                        }
                    }
                });

        return data;
    }

    public Mono<Map<String, String>> getAll() {
        return verifyCurrentUserIsSuper()
                .flatMap(user -> {
                    final String originalContent;
                    try {
                        originalContent = Files.readString(Path.of(commonConfig.getEnvFilePath()));
                    } catch (IOException e) {
                        log.error("Unable to read env file " + commonConfig.getEnvFilePath(), e);
                        return Mono.error(e);
                    }

                    return Mono.justOrEmpty(parseToMap(originalContent));
                });
    }

    public Mono<User> verifyCurrentUserIsSuper() {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .filter(user -> policyUtils.isPermissionPresentForUser(
                        user.getPolicies(),
                        AclPermission.MANAGE_INSTANCE_ENV.getValue(),
                        user.getUsername()
                ))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));
    }

    public Mono<Void> restartServer() {
        return verifyCurrentUserIsSuper()
                .flatMap(user -> {
                    log.warn("Initiating restart via supervisor.");
                    try {
                        Runtime.getRuntime().exec(new String[]{
                                "supervisorctl",
                                "restart",
                                "backend",
                        });
                    } catch (IOException e) {
                        log.error("Error invoking supervisorctl to restart server.", e);
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }
                    return Mono.empty();
                });
    }

    public Mono<Boolean> sendTestEmail() {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> emailSender.sendMail(
                        user.getEmail(),
                        "Test email from Appsmith",
                        "This is a test email from Appsmith, initiated from Admin Settings page. If you are seeing this, your email configuration is working!\n"
                ));
    }

}
