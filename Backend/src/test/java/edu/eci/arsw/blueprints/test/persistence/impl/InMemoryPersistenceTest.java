package edu.eci.arsw.blueprints.test.persistence.impl;

import edu.eci.arsw.blueprints.model.*;
import edu.eci.arsw.blueprints.persistence.*;
import edu.eci.arsw.blueprints.persistence.impl.InMemoryBlueprintPersistence;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

public class InMemoryPersistenceTest {
    private InMemoryBlueprintPersistence persistence;

    @BeforeEach
    void setUp() {
        persistence = new InMemoryBlueprintPersistence();
    }

    @Test
    void saveNewAndLoadTest() throws BlueprintPersistenceException, BlueprintNotFoundException {
        Point[] pts0 = new Point[]{new Point(40, 40), new Point(15, 15)};
        Blueprint bp0 = new Blueprint("Andres", "CICLOS", pts0);
        persistence.saveBlueprint(bp0);

        Point[] pts = new Point[]{new Point(0, 0), new Point(10, 10)};
        Blueprint bp = new Blueprint("Javier", "ARWS", pts);
        persistence.saveBlueprint(bp);

        assertNotNull(persistence.getBlueprint(bp.getAuthor(), bp.getName()));
        assertEquals(bp, persistence.getBlueprint(bp.getAuthor(), bp.getName()));
    }

    @Test
    void saveExistingBlueprintThrowsException() throws BlueprintPersistenceException {
        Point[] pts = new Point[]{new Point(0, 0), new Point(10, 10)};
        Blueprint bp = new Blueprint("Javier", "ARWS", pts);
        persistence.saveBlueprint(bp);

        Point[] pts2 = new Point[]{new Point(10, 10), new Point(20, 20)};
        Blueprint bp2 = new Blueprint("Javier", "ARWS", pts2);

        assertThrows(BlueprintPersistenceException.class, () -> persistence.saveBlueprint(bp2));
    }

    @Test
    void saveAndRetrieveBlueprint() throws Exception {
        Blueprint bp = new Blueprint("Javier", "ARWS", new Point[]{new Point(10, 10), new Point(20, 20)});
        persistence.saveBlueprint(bp);
        assertEquals(bp, persistence.getBlueprint("Javier", "ARWS"));
    }

    @Test
    void getNonExistingBlueprintThrowsException() {
        assertThrows(BlueprintNotFoundException.class, () -> persistence.getBlueprint("Desconocido", "NoBlueprint"));
    }

    @Test
    void getBlueprintsByAuthor() throws Exception {
        Blueprint bp1 = new Blueprint("Alice", "IETI1", new Point[]{new Point(10, 10)});
        Blueprint bp2 = new Blueprint("Alice", "IETI2", new Point[]{new Point(20, 20)});
        persistence.saveBlueprint(bp1);
        persistence.saveBlueprint(bp2);

        Set<Blueprint> blueprints = persistence.getBlueprintsByAuthor("Alice");
        assertEquals(2, blueprints.size());
    }

    @Test
    void getBlueprintsByNonExistingAuthor() {
        assertThrows(BlueprintNotFoundException.class, () -> persistence.getBlueprintsByAuthor("NoAutor"));
    }

    @Test
    void blueprintNamesShouldBeTrimmed() throws BlueprintPersistenceException, BlueprintNotFoundException {
        Blueprint bp = new Blueprint("Daniel", "  MyBlueprint  ", new Point[]{new Point(10, 10)});
        persistence.saveBlueprint(bp);

        assertNotNull(persistence.getBlueprint("Daniel", "MyBlueprint"));
    }

    @Test
    void getAllBlueprints() throws BlueprintPersistenceException {
        Blueprint bp1 = new Blueprint("Carlos", "Plan1", new Point[]{new Point(5, 5)});
        Blueprint bp2 = new Blueprint("Laura", "Plan2", new Point[]{new Point(15, 15)});
        persistence.saveBlueprint(bp1);
        persistence.saveBlueprint(bp2);

        Set<Blueprint> allBlueprints = persistence.getAllBluePrints();
        assertTrue(allBlueprints.contains(bp1));
        assertTrue(allBlueprints.contains(bp2));
        assertEquals(6, allBlueprints.size());
    }

    @Test
    public void updateBlueprintSuccessfully() throws BlueprintNotFoundException {
        Point[] points = new Point[]{new Point(1, 1), new Point(2, 2)};
        Blueprint blueprint = new Blueprint("Juan", "EdificioA", points);
        Blueprint updatedBlueprint = persistence.updateBlueprint("Juan", "EdificioA", blueprint);
        assertEquals(blueprint, updatedBlueprint);
    }

    @Test
    public void updateBlueprintNotFound() {
        Point[] points = new Point[]{new Point(1, 1), new Point(2, 2)};
        Blueprint blueprint = new Blueprint("Juan", "NonExistent", points);
        assertThrows(BlueprintNotFoundException.class, () -> {
            persistence.updateBlueprint("Juan", "NonExistent", blueprint);
        });
    }

    @Test
    public void deleteBlueprintSuccessfully() throws BlueprintNotFoundException {
        persistence.deleteBlueprint("Juan", "EdificioA");
        assertThrows(BlueprintNotFoundException.class, () -> {
            persistence.getBlueprint("Juan", "EdificioA");
        });
    }

    @Test
    public void deleteBlueprintNotFound() {
        assertThrows(BlueprintNotFoundException.class, () -> {
            persistence.deleteBlueprint("Juan", "NonExistent");
        });
    }
}
