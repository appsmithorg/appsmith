package com.appsmith.external.datasource.connectionproperties;

import java.util.Properties;
import lombok.Data;
import lombok.Getter;

@Data
@Getter
public class SnowflakeConnectionProperties {

    Properties properties;

    public SnowflakeConnectionProperties() {
        this.properties = new Properties();
    }
}
