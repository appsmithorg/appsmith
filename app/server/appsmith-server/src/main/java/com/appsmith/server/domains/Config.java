package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.JSONObject;
import org.hibernate.annotations.Type;

import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
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
