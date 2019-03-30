package com.mobtools.server.services;

import com.mobtools.server.domains.Property;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Component
public class PostgresDBPluginExecutor implements PluginExecutor {

    @Override
    public Flux<Object> execute() {
        Property prop = new Property();
        prop.setKey("name");
        prop.setValue("val");

        List<Property> props= new ArrayList<>();
        props.add(prop);

        return Flux.just(props);
    }

}
