package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.constants.EnvVariables;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.EnvChangesResponseDTO;
import com.appsmith.server.dtos.TestEmailConfigRequestDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
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
import static com.appsmith.server.constants.EnvVariables.APPSMITH_RECAPTCHA_SECRET_KEY;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_RECAPTCHA_SITE_KEY;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_REPLY_TO;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SIGNUP_ALLOWED_DOMAINS;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SIGNUP_DISABLED;

@RequiredArgsConstructor
@Slf4j
@Getter
public class EnvManagerCEImpl implements EnvManagerCE {

    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final PolicyUtils policyUtils;
    private final EmailSender emailSender;

    private final CommonConfig commonConfig;
    private final EmailConfig emailConfig;
    private final JavaMailSender javaMailSender;
    private final GoogleRecaptchaConfig googleRecaptchaConfig;
    private final FileUtils fileUtils;

    /**
     * This regex pattern matches environment variable declarations like `VAR_NAME=value` or `VAR_NAME="value"` or just
     * `VAR_NAME=`. It also defines two named capture groups, `name` and `value`, for the variable's name and value
     * respectively.
     */
    private static final Pattern ENV_VARIABLE_PATTERN = Pattern.compile(
            "^(?<name>[A-Z0-9_]+)\\s*=\\s*\"?(?<value>.*?)\"?$"
    );

    private static final Set<String> VARIABLE_WHITELIST = Stream.of(EnvVariables.values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    /**
     * Updates values of variables in the envContent string, based on the changes map given. This function **only**
     * updates values of variables that already defined in envContent. It NEVER adds new env variables to it. This is so
     * a malicious request won't insert new dubious env variables.
     * @param envContent String content of an env file.
     * @param changes A map with variable name to new value.
     * @return List of string lines for updated env file content.
     */
    public List<String> transformEnvContent(String envContent, Map<String, String> changes) {
        final Set<String> variablesNotInWhitelist = new HashSet<>(changes.keySet());
        variablesNotInWhitelist.removeAll(VARIABLE_WHITELIST);

        if (!variablesNotInWhitelist.isEmpty()) {
            throw new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS);
        }

        if (changes.containsKey(APPSMITH_MAIL_HOST.name())) {
            changes.put(
                    APPSMITH_MAIL_ENABLED.name(),
                    Boolean.toString(!StringUtils.isEmpty(changes.get(APPSMITH_MAIL_HOST.name())))
            );
        }

        if (changes.containsKey(APPSMITH_MAIL_USERNAME.name())) {
            changes.put(
                    APPSMITH_MAIL_SMTP_AUTH.name(),
                    Boolean.toString(!StringUtils.isEmpty(changes.get(APPSMITH_MAIL_USERNAME.name())))
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

                    if (changesCopy.containsKey(APPSMITH_INSTANCE_NAME.name())) {
                        commonConfig.setInstanceName(changesCopy.remove(APPSMITH_INSTANCE_NAME.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_SIGNUP_DISABLED.name())) {
                        commonConfig.setSignupDisabled("true".equals(changesCopy.remove(APPSMITH_SIGNUP_DISABLED.name())));
                    }

                    if (changesCopy.containsKey(APPSMITH_SIGNUP_ALLOWED_DOMAINS.name())) {
                        commonConfig.setAllowedDomainsString(changesCopy.remove(APPSMITH_SIGNUP_ALLOWED_DOMAINS.name()));
                    }

                    if (changesCopy.containsKey(APPSMITH_ADMIN_EMAILS.name())) {
                        commonConfig.setAdminEmails(changesCopy.remove(APPSMITH_ADMIN_EMAILS.name()));
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

                    // Ideally, we should only need a restart here if `changesCopy` is not empty. However, some of these
                    // env variables are also used in client code, which means restart might be necessary there. So, to
                    // provide a more uniform and predictable experience, we always restart.

                    Mono.delay(Duration.ofSeconds(1))
                            .flatMap(ignored -> restart())
                            .subscribeOn(Schedulers.boundedElastic())
                            .subscribe();

                    return Mono.just(new EnvChangesResponseDTO(true));
                });
    }

    public Map<String, String> parseToMap(String content) {
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

                    // set the default values to response
                    Map<String, String> envKeyValueMap = parseToMap(originalContent);
                    if(!envKeyValueMap.containsKey(APPSMITH_INSTANCE_NAME.name())) {
                        // no APPSMITH_INSTANCE_NAME set in env file, set the default value
                        envKeyValueMap.put(APPSMITH_INSTANCE_NAME.name(), commonConfig.getInstanceName());
                    }

                    return Mono.justOrEmpty(envKeyValueMap);
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

    public Mono<Boolean> sendTestEmail(TestEmailConfigRequestDTO requestDTO) {
        return verifyCurrentUserIsSuper()
                .flatMap(user -> {
                    JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
                    mailSender.setHost(requestDTO.getSmtpHost());
                    mailSender.setPort(requestDTO.getSmtpPort());

                    Properties props = mailSender.getJavaMailProperties();
                    props.put("mail.transport.protocol", "smtp");
                    props.put("mail.smtp.starttls.enable", "true");

                    if(!StringUtils.isEmpty(requestDTO.getUsername())) {
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
                        mailSender.send(message);
                    } catch (MailException mailException) {
                        log.error("failed to send test email", mailException);
                        throw new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "check log for details");
                    }
                    return Mono.just(Boolean.TRUE);
                });
    }

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
