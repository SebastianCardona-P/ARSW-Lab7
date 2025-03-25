package edu.eci.arsw.blueprints.filters;

import edu.eci.arsw.blueprints.model.Blueprint;
import java.util.Set;

/**
 * Interfaz para la aplicación de filtros sobre los blueprints.
 */
public interface Filter {
    public abstract Blueprint filterPlain(Blueprint blueprint);
    public Set<Blueprint> filterBlueprints(Set<Blueprint> blueprints);
}
