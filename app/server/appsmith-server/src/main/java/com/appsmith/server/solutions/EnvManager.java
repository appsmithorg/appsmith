package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
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

    @Value("${appsmith.admin.envfile:/opt/appsmith/docker.env}")
    public String envFilePath;

    private static final Pattern ENV_VARIABLE_PATTERN = Pattern.compile(
            "^(?<name>[A-Z0-9_]+)\\s*=\\s*\"?(?<value>.*?)\"?$"
    );

    private static final Set<String> VARIABLE_BLACKLIST = Set.of(
            "APPSMITH_ENCRYPTION_PASSWORD",
            "APPSMITH_ENCRYPTION_SALT"
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
        for (final String variable : VARIABLE_BLACKLIST) {
            if (changes.containsKey(variable)) {
                throw new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS);
            }
        }

        return envContent.lines()
                .map(line -> {
                    final Matcher matcher = ENV_VARIABLE_PATTERN.matcher(line);
                    if (!matcher.matches()) {
                        return line;
                    }
                    final String name = matcher.group("name");
                    if (!changes.containsKey(name)) {
                        return line;
                    }
                    return line.substring(0, matcher.start("value"))
                                    + changes.get(name)
                                    + line.substring(matcher.end("value"));
                })
                .collect(Collectors.toList());
    }

    public Mono<Boolean> applyChanges(Map<String, String> changes) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .filter(user -> policyUtils.isPermissionPresentForUser(
                        user.getPolicies(),
                        AclPermission.MANAGE_INSTANCE_ENV.getValue(),
                        user.getUsername()
                ))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(user -> {
                    final String originalContent;
                    try {
                        originalContent = Files.readString(Path.of(envFilePath));
                    } catch (IOException e) {
                        log.error("Unable to read env file " + envFilePath, e);
                        return Mono.error(e);
                    }

                    final List<String> changedContent = transformEnvContent(originalContent, changes);

                    try {
                        Files.write(Path.of(envFilePath), changedContent);
                    } catch (IOException e) {
                        e.printStackTrace();
                        return Mono.just(false);
                    }

                    return Mono.just(true);
                });
    }

}
