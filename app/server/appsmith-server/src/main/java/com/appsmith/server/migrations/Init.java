package com.appsmith.server.migrations;

import com.appsmith.server.repositories.ConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class Init {

    private final ConfigRepository configRepository;

    @PostConstruct
    public void init() {
        configRepository.save("feature", "enableTemplateImport", "true");
    }

}
