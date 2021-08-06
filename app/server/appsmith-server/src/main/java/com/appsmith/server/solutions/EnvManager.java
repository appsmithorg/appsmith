package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private static final Path ENV_FILE_PATH = Path.of("server-controlled.env");

    private static final Pattern ENV_VARIABLE_PATTERN = Pattern.compile(
            "^(?<name>[A-Z0-9_]+)\\s*=\\s*\"?(?<value>.*?)\"?$"
    );

    private static final Set<String> DISALLOWED_VARIABLES = Set.of(
            "APPSMITH_ENCRYPTION_PASSWORD",
            "APPSMITH_ENCRYPTION_SALT"
    );

    public static List<String> transformEnvContent(String envContent, Map<String, String> changes) {
        for (final String variable : DISALLOWED_VARIABLES) {
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
                        AclPermission.MANAGE_INSTANCE_CONFIG.getValue(),
                        user.getUsername()
                ))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(user -> {
                    final String originalContent;
                    try {
                        originalContent = Files.readString(ENV_FILE_PATH);
                    } catch (IOException e) {
                        log.error("Unable to read env file " + ENV_FILE_PATH, e);
                        return Mono.error(e);
                    }

                    final List<String> changedContent = transformEnvContent(originalContent, changes);

                    try {
                        Files.write(ENV_FILE_PATH, changedContent);
                    } catch (IOException e) {
                        e.printStackTrace();
                        return Mono.just(false);
                    }

                    return Mono.just(true);
                });
    }

}
