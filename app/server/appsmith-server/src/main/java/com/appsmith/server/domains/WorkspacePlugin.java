package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Objects;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class WorkspacePlugin extends BaseDomain {

    @OneToOne
    private Workspace workspace;

    @OneToOne
    private Plugin plugin;

    private WorkspacePluginStatus status;

    public String getPluginId() {
        return plugin.getId();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WorkspacePlugin that = (WorkspacePlugin) o;
        return Objects.equals(id, that.id) && Objects.equals(plugin, that.plugin) && status == that.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, plugin, status);
    }
}
