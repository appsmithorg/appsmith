package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
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

    @ManyToOne
    @JoinColumn(name = "plugin_id", referencedColumnName = "id")
    private Plugin plugin;

    @Column(name = "plugin_id", insertable = false, updatable = false)
    private String pluginId;

    private WorkspacePluginStatus status;

    public WorkspacePlugin(Plugin plugin, WorkspacePluginStatus status) {
        setPlugin(plugin);
        setStatus(status);
    }

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
