package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import net.minidev.json.JSONObject;
import org.hibernate.annotations.Type;

import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
@FieldNameConstants
public class Config extends BaseDomain {
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private JSONObject config;

    @Column(unique = true)
    String name;

    public static Config fromMap(String name, Map<String, ?> config) {
        return new Config(new JSONObject(config), name);
    }
}
