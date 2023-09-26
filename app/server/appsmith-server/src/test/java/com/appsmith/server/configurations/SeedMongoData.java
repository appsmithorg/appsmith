package com.appsmith.server.configurations;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.dtos.UserSignupDTO;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Configuration
public class SeedMongoData {

    @Bean
    ApplicationRunner init(
            UserRepository userRepository,
            UserService userService,
            UserUtils userUtils,
            PluginRepository pluginRepository) {

        log.info("Seeding the data");
        final String API_USER_EMAIL = "api_user";
        final String TEST_USER_EMAIL = "usertest@usertest.com";
        final String ADMIN_USER_EMAIL = "admin@solutiontest.com";
        final String DEV_USER_EMAIL = "developer@solutiontest.com";

        Object[][] userData = {
            {
                "user test", TEST_USER_EMAIL, UserState.ACTIVATED,
            },
            {
                "api_user", API_USER_EMAIL, UserState.ACTIVATED,
            },
            {
                "admin test", ADMIN_USER_EMAIL, UserState.ACTIVATED,
            },
            {
                "developer test", DEV_USER_EMAIL, UserState.ACTIVATED,
            },
        };

        Object[][] pluginData = {
            {"Installed Plugin Name", PluginType.API, "installed-plugin"},
            {"Installed DB Plugin Name", PluginType.DB, "installed-db-plugin"},
            {"Installed JS Plugin Name", PluginType.JS, "installed-js-plugin"},
            {"Not Installed Plugin Name", PluginType.API, "not-installed-plugin"}
        };

        Mono<List<Plugin>> pluginListMono = Flux.fromArray(pluginData)
                .flatMap(array -> {
                    log.debug("Creating the plugins");
                    Plugin plugin = new Plugin();
                    plugin.setName((String) array[0]);
                    plugin.setType((PluginType) array[1]);
                    plugin.setPackageName((String) array[2]);
                    log.debug("Create plugin: {}", plugin);
                    return pluginRepository.save(plugin);
                })
                .collectList();

        Mono<List<UserSignupDTO>> userSignupDTOListMono = Flux.fromArray(userData)
                .flatMap(userDataArray -> {
                    log.debug("Creating the Users");
                    User user = new User();
                    user.setName((String) userDataArray[0]);
                    user.setEmail((String) userDataArray[1]);
                    user.setPassword((String) userDataArray[1]);
                    user.setState((UserState) userDataArray[2]);
                    return userService.createUser(user);
                })
                .collectList();

        Mono<Boolean> makeApiUserSuperUserMono = userRepository
                .findByCaseInsensitiveEmail(API_USER_EMAIL)
                .flatMap(apiUser -> userUtils.makeSuperUser(List.of(apiUser)));

        return args -> {
            userSignupDTOListMono
                    .flatMap(userSignupDTOS -> pluginListMono)
                    .flatMap(pluginList -> makeApiUserSuperUserMono)
                    .map(superSuperMade -> superSuperMade)
                    .block();
        };
    }
}
