package edu.eci.arsw.blueprints.persistence.impl;

import edu.eci.arsw.blueprints.model.*;
import edu.eci.arsw.blueprints.persistence.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementación en memoria de la persistencia de planos.
 * Almacena los planos en un mapa en memoria.
 */
@Service
public class InMemoryBlueprintPersistence implements BlueprintsPersistence{

    private final Map<Tuple<String,String>,Blueprint> blueprints=new ConcurrentHashMap<>();

    public InMemoryBlueprintPersistence() {
        //load one BluePrint
        Point[] pts1=new Point[]{new Point(140, 140),new Point(115, 115), new Point(115, 115)};
        Blueprint bp1=new Blueprint("Juan", "EdificioA",pts1);
        blueprints.put(new Tuple<>(bp1.getAuthor(),bp1.getName()), bp1);

        //Load another BluePrint
        Point[] pts2=new Point[]{new Point(10, 24),new Point(10, 24), new Point(100, 100)};
        Blueprint bp2=new Blueprint("Juan", "EdificioB",pts2);
        blueprints.put(new Tuple<>(bp2.getAuthor(),bp2.getName()), bp2);

        //Load another BluePrint
        Point[] pts3=new Point[]{new Point(70, 248),new Point(110, 240), new Point(100, 100), new Point(100, 100)};
        Blueprint bp3=new Blueprint("Marcos", "EdificioC",pts3);
        blueprints.put(new Tuple<>(bp3.getAuthor(),bp3.getName()), bp3);

        //Load another BluePrint
        Point[] pts4=new Point[]{new Point(50, 10),new Point(50, 60), new Point(60, 70), new Point(70, 60), new Point(70, 10)};
        Blueprint bp4=new Blueprint("Juan", "EdificioD",pts4);
        blueprints.put(new Tuple<>(bp4.getAuthor(),bp4.getName()), bp4);
        
    }

    /**
     * Guarda un nuevo blueprint en la memoria.
     * @param bp El blueprint a guardar.
     * @throws BlueprintPersistenceException si el blueprint ya existe.
     */
    @Override
    public void saveBlueprint(Blueprint bp) throws BlueprintPersistenceException {
        String authorTrimmed = bp.getAuthor().trim();
        String nameTrimmed = bp.getName().trim();
        Tuple<String, String> key = new Tuple<>(authorTrimmed, nameTrimmed);

        if (blueprints.putIfAbsent(key, bp) != null) {
            throw new BlueprintPersistenceException("The given blueprint already exists: " + bp);
        }
    }


    /**
     * Obtiene un blueprint por autor y nombre.
     * @param author Nombre del autor.
     * @param bprintname Nombre del blueprint.
     * @return El blueprint correspondiente.
     * @throws BlueprintNotFoundException si no se encuentra el blueprint.
     */
    @Override
    public Blueprint getBlueprint(String author, String bprintname) throws BlueprintNotFoundException {
        String authorTrimmed = author.trim();
        String nameTrimmed = bprintname.trim();
        Blueprint bp = blueprints.get(new Tuple<>(authorTrimmed, nameTrimmed));
        if (bp == null) {
            throw new BlueprintNotFoundException("Blueprint not found: " + author + " - " + bprintname);
        }
        return bp;
    }

    /**
     * Obtiene todos los blueprints de un autor específico.
     * @param author Nombre del autor.
     * @return Un conjunto de blueprints del autor.
     * @throws BlueprintNotFoundException si el autor no tiene blueprints.
     */
    @Override
    public Set<Blueprint> getBlueprintsByAuthor(String author) throws BlueprintNotFoundException {
        String authorTrimmed = author.trim();
        Set<Blueprint> result = new HashSet<>();
        for (Map.Entry<Tuple<String, String>, Blueprint> entry : blueprints.entrySet()) {
            if (entry.getKey().getElem1().equals(authorTrimmed)) {
                result.add(entry.getValue());
            }
        }

        if (result.isEmpty()) {
            throw new BlueprintNotFoundException("No blueprints found for author: " + author);
        }
        return result;
    }

    /**
     * Obtiene todos los blueprints almacenados en memoria.
     * @return Un conjunto de todos los blueprints.
     */
    @Override
    public Set<Blueprint> getAllBluePrints(){
        Set<Blueprint> blueprintSet = new HashSet<>();

        for (Tuple<String, String> i : blueprints.keySet()){
            blueprintSet.add(blueprints.get(i));
        }

        return blueprintSet;
    }


    /**
     * Actualiza un blueprint en memoria.
     * @param author Nombre del autor.
     * @param name Nombre del blueprint.
     * @param blueprint El nuevo a actualizar.
     * @return El blueprint actualizado.
     * @throws BlueprintNotFoundException si no se encuentra el blueprint.
     */
    @Override
    public Blueprint updateBlueprint(String author, String name, Blueprint blueprint) throws BlueprintNotFoundException {
        String authorTrimmed = author.trim();
        String nameTrimmed = name.trim();
        Tuple<String, String> key = new Tuple<>(authorTrimmed, nameTrimmed);

        blueprint.setAuthor(authorTrimmed);
        blueprint.setName(nameTrimmed);
        if (blueprints.replace(key, blueprint) == null) {
            throw new BlueprintNotFoundException("Blueprint not found: " + author + " - " + name);
        }
        return blueprint;
    }

    /**
     * Elimina un blueprint de la memoria.
     * @param author Nombre del autor.
     * @param name Nombre del blueprint.
     * @throws BlueprintNotFoundException si no se encuentra el blueprint.
     */
    @Override
    public void deleteBlueprint(String author, String name) throws BlueprintNotFoundException {
        String authorTrimmed = author.trim();
        String nameTrimmed = name.trim();
        Tuple<String, String> key = new Tuple<>(authorTrimmed, nameTrimmed);

        if (blueprints.remove(key) == null) {
            throw new BlueprintNotFoundException("Blueprint not found: " + author + " - " + name);
        }
    }
}
