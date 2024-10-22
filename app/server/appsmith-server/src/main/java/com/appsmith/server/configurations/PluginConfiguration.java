package com.appsmith.server.configurations;

import jakarta.annotation.PostConstruct;
import org.pf4j.ExtensionFactory;
import org.pf4j.PropertiesPluginDescriptorFinder;
import org.pf4j.spring.ExtensionsInjector;
import org.pf4j.spring.SpringExtensionFactory;
import org.pf4j.spring.SpringPlugin;
import org.pf4j.spring.SpringPluginManager;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PluginConfiguration {

    @Bean
    public SpringPluginManager pluginManager(ApplicationContext applicationContext) {
        return new CustomPluginManager(applicationContext);
    }

    private static class CustomPluginManager extends SpringPluginManager {

        private ApplicationContext applicationContext;

        private CustomSpringExtensionFactory ef;

        public CustomPluginManager(ApplicationContext applicationContext) {
            super();
            this.applicationContext = applicationContext;
            this.ef = new CustomSpringExtensionFactory(this);
            pluginDescriptorFinder = "development".equals(System.getProperty("pf4j.mode"))
                    ? new PropertiesPluginDescriptorFinder("target/classes/plugin.properties")
                    : new PropertiesPluginDescriptorFinder();
        }

        @Override
        protected ExtensionFactory createExtensionFactory() {
            ef = new CustomSpringExtensionFactory(this);
            return ef;
        }

        @Override
        public ExtensionFactory getExtensionFactory() {
            return ef;
        }

        @Override
        public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
            this.applicationContext = applicationContext;
            ef.setApplicationContext(applicationContext);
        }

        public ApplicationContext getApplicationContext() {
            return applicationContext;
        }

        /**
         * This method load, start plugins and inject extensions in Spring
         */
        @PostConstruct
        public void init() {
            loadPlugins();
            startPlugins();

            AbstractAutowireCapableBeanFactory beanFactory =
                    (AbstractAutowireCapableBeanFactory) applicationContext.getAutowireCapableBeanFactory();
            ExtensionsInjector extensionsInjector = new ExtensionsInjector(this, beanFactory);

            ef.setApplicationContext(this.applicationContext);
            extensionsInjector.injectExtensions();
        }
    }

    static class CustomSpringExtensionFactory extends SpringExtensionFactory {

        private ApplicationContext applicationContext;

        public CustomSpringExtensionFactory(SpringPluginManager pluginManager) {
            this(pluginManager, true);
        }

        public CustomSpringExtensionFactory(SpringPluginManager pluginManager, boolean autowire) {
            super(pluginManager, autowire);
        }

        @Override
        public <T> T create(Class<T> extensionClass) {
            T extension = createWithSpring(extensionClass, this.applicationContext);
            if (extension instanceof SpringPlugin sp) {
                ConfigurableApplicationContext pluginContext =
                        (ConfigurableApplicationContext) sp.getApplicationContext();
                pluginContext.setParent(applicationContext);
            }
            return extension;
        }

        public void setApplicationContext(ApplicationContext applicationContext) {
            this.applicationContext = applicationContext;
        }
    }
}
