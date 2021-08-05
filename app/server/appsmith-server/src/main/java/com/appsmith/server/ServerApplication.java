package com.appsmith.server;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ServerApplication {

    public static void main(String[] args) {
        new SpringApplicationBuilder(ServerApplication.class)
                // .initializers(new CustomInit())
                .run(args);
        // SpringApplication.run(ServerApplication.class, args);
    }

    static class CustomInit implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            final ConfigurableEnvironment environment = context.getEnvironment();
            environment.getPropertySources().addAfter(
                    StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                    new CustomPropertySource("custom-env")
            );
        }
    }

    static class CustomPropertySource extends PropertySource<CustomLoader> {
        public CustomPropertySource(String name) {
            super(name);
        }

        @Override
        public Object getProperty(String s) {
            return s + " value";
        }
    }

    static class CustomLoader {
        public Object getValue(String key) {
            return key;
        }
    }

}
