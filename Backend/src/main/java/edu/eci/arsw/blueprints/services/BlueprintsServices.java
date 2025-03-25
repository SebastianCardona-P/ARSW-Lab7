package edu.eci.arsw.blueprints.services;

import edu.eci.arsw.blueprints.filters.*;
import edu.eci.arsw.blueprints.model.*;
import edu.eci.arsw.blueprints.persistence.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Servicio para la gestión de Blueprints.
 * Proporciona métodos para agregar, recuperar y filtrar planos.
 */
@Service
public class BlueprintsServices {
   
    @Autowired
    BlueprintsPersistence bpp;

    @Autowired
    private Filter filter;

    /**
     * Agrega un nuevo blueprint al sistema.
     * @param bp El blueprint a agregar.
     * @throws UnsupportedOperationException si el blueprint ya existe.
     */
    public void addNewBlueprint(Blueprint bp) throws BlueprintPersistenceException{
        bpp.saveBlueprint(bp);
    }

    /**
     * Obtiene todos los blueprints disponibles, aplicando el filtro correspondiente.
     * @return Un conjunto de todos los blueprints filtrados.
     */
    public Set<Blueprint> getAllBlueprints(){
        return filter.filterBlueprints(bpp.getAllBluePrints());
    }

    /**
     * Obtiene un blueprint específico basado en el autor y el nombre.
     * @param author Autor del blueprint.
     * @param name Nombre del blueprint.
     * @return El blueprint filtrado.
     * @throws BlueprintNotFoundException si no se encuentra el blueprint.
     */
    public Blueprint getBlueprint(String author,String name) throws BlueprintNotFoundException{
        return bpp.getBlueprint(author, name);
    }

    /**
     * Obtiene todos los blueprints de un autor específico.
     * @param author Autor de los blueprints.
     * @return Un conjunto de blueprints filtrados del autor.
     * @throws BlueprintNotFoundException si el autor no tiene blueprints.
     */
    public Set<Blueprint> getBlueprintsByAuthor(String author) throws BlueprintNotFoundException{
        return bpp.getBlueprintsByAuthor(author);
    }

    /**
     * Actualiza un blueprint existente.
     * @param author Autor del blueprint.
     * @param name Nombre del blueprint.
     * @param blueprint El nuevo blueprint.
     * @return El blueprint actualizado.
     * @throws BlueprintNotFoundException si no se encuentra el blueprint.
     */
    public Blueprint updateBlueprint(String author, String name, Blueprint blueprint) throws BlueprintNotFoundException {
        return filter.filterPlain(bpp.updateBlueprint(author, name, blueprint));
    }

    /**
     * Eliminar un blueprint existente
     * @param author Autor del blueprint.
     * @param name Nombre del blueprint.
     * @throws BlueprintNotFoundException si no se encuentra el blueprint.
     * @throws BlueprintPersistenceException si no se puede eliminar el blueprint.
     */
    public void deleteBlueprint(String author, String name) throws BlueprintNotFoundException, BlueprintPersistenceException {
        bpp.deleteBlueprint(author, name);
    }

}
