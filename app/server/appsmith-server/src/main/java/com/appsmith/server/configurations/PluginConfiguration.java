package com.appsmith.server.configurations;

import org.pf4j.PropertiesPluginDescriptorFinder;
import org.pf4j.spring.SpringPluginManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PluginConfiguration {

    @Bean
    public SpringPluginManager pluginManager() {
        return new CustomPluginManager();
    }

    private static class CustomPluginManager extends SpringPluginManager {
        public CustomPluginManager() {
            super();
            pluginDescriptorFinder = "development".equals(System.getProperty("pf4j.mode"))
                    ? new PropertiesPluginDescriptorFinder("target/classes/plugin.properties")
                    : new PropertiesPluginDescriptorFinder();
        }
    }
}
