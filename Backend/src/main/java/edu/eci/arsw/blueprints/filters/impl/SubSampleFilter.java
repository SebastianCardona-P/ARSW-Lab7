package edu.eci.arsw.blueprints.filters.impl;

import edu.eci.arsw.blueprints.filters.*;
import edu.eci.arsw.blueprints.model.*;
import org.springframework.stereotype.Service;
import java.util.*;

/**
 * Implementación del filtro de submuestreo para blueprints.
 * Este filtro elimina uno de cada dos puntos en un blueprint para reducir su tamaño.
 */
@Service
public class SubSampleFilter implements Filter {

    /**
     * Filtra un blueprint eliminando uno de cada dos puntos.
     * @param blueprint Blueprint a filtrar.
     * @return Blueprint filtrado con la mitad de los puntos originales.
     */
    @Override
    public Blueprint filterPlain(Blueprint blueprint) {

        List<Point> originalPoints = blueprint.getPoints();
        // Si solo hay un punto, no hay nada que filtrar
        if (blueprint.getPoints().size() <= 1) {
            return blueprint;
        }

        // Crear un nuevo array con la mitad de los puntos (eliminando 1 de cada 2)
        Point[] filteredPoints = new Point[(originalPoints.size() + 1) / 2];
        for (int i = 0, j = 0; i < originalPoints.size(); i += 2, j++) {
            filteredPoints[j] = originalPoints.get(i);
        }

        return new Blueprint(blueprint.getAuthor(), blueprint.getName(), filteredPoints);
    }

    /**
     * Filtra un conjunto de blueprints aplicando el submuestreo a cada uno.
     * @param blueprints Conjunto de blueprints a filtrar.
     * @return Conjunto de blueprints filtrados.
     */
    @Override
    public Set<Blueprint> filterBlueprints(Set<Blueprint> blueprints) {
        Set<Blueprint> newBlueprintSet = new HashSet<>();

        for (Blueprint i : blueprints) {
            newBlueprintSet.add(filterPlain(i));
        }

        return newBlueprintSet;
    }
}
