package com.appsmith.server.domains;

import com.appsmith.external.models.EntityDependencyNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang.builder.EqualsBuilder;
import org.apache.commons.lang.builder.HashCodeBuilder;

@Getter
@Setter
@AllArgsConstructor
public class ExecutableDependencyEdge {

    EntityDependencyNode sourceNode;
    EntityDependencyNode targetNode;

    @Override
    public int hashCode() {
        if (sourceNode == null || targetNode == null) {
            return 0;
        }

        return new HashCodeBuilder()
                .append(sourceNode.getReferenceString())
                .append(targetNode.getReferenceString())
                .toHashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof ExecutableDependencyEdge) {
            final ExecutableDependencyEdge executableDependencyEdge = (ExecutableDependencyEdge) obj;

            if (sourceNode == null
                    || targetNode == null
                    || executableDependencyEdge.sourceNode == null
                    || executableDependencyEdge.targetNode == null) {
                return false;
            }

            return new EqualsBuilder()
                    .append(sourceNode.getReferenceString(), executableDependencyEdge.sourceNode.getReferenceString())
                    .append(targetNode.getReferenceString(), executableDependencyEdge.targetNode.getReferenceString())
                    .append(
                            sourceNode.getEntityReferenceType(),
                            executableDependencyEdge.sourceNode.getEntityReferenceType())
                    .append(
                            targetNode.getEntityReferenceType(),
                            executableDependencyEdge.targetNode.getEntityReferenceType())
                    .isEquals();
        } else {
            return false;
        }
    }

    @Override
    public String toString() {
        if (sourceNode == null || targetNode == null) {
            return "";
        }
        return sourceNode.getReferenceString() + " : " + targetNode.getReferenceString();
    }
}
