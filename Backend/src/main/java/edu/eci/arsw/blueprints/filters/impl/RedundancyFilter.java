package edu.eci.arsw.blueprints.filters.impl;

import edu.eci.arsw.blueprints.filters.*;
import edu.eci.arsw.blueprints.model.*;
import java.util.*;

/**
 * Implementación del filtro de redundancia para blueprints.
 * Este filtro elimina puntos consecutivos repetidos en un blueprint.
 */

//@Service
public class RedundancyFilter implements Filter {

    /**
     * Filtra un blueprint eliminando puntos consecutivos duplicados.
     * @param blueprint Blueprint a filtrar.
     * @return Blueprint filtrado sin puntos redundantes.
     */
    @Override
    public Blueprint filterPlain(Blueprint blueprint){

        List<Point> originalPoints = blueprint.getPoints();
        // Si solo hay un punto, no hay nada que filtrar
        if (blueprint.getPoints().size() <= 1) {
            return blueprint;
        }

        List<Point> filteredPoints = new ArrayList<>();
        filteredPoints.add(originalPoints.get(0));

        for (int i = 1; i < originalPoints.size(); i++) {
            Point prev = originalPoints.get(i-1);
            Point current = originalPoints.get(i);

            if (!(prev.getX() == current.getX() && prev.getY() == current.getY())) {
                filteredPoints.add(current);
            }
        }

        // Convertimos la lista a un array de puntos
        Point[] resultPoints = filteredPoints.toArray(new Point[0]);
        return new Blueprint(blueprint.getAuthor(), blueprint.getName(), resultPoints);
    }

    /**
     * Filtra un conjunto de blueprints aplicando el filtro de redundancia a cada uno.
     * @param blueprints Conjunto de blueprints a filtrar.
     * @return Conjunto de blueprints filtrados.
     */
    @Override
    public Set<Blueprint> filterBlueprints(Set<Blueprint> blueprints){
        Set<Blueprint> newBlueprintSet = new HashSet<>();

        for(Blueprint i: blueprints){
            newBlueprintSet.add(filterPlain(i));
        }
        return newBlueprintSet;
    }
}
