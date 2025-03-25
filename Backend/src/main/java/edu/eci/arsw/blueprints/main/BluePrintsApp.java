package edu.eci.arsw.blueprints.main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase principal para la aplicación BluePrints.
 * Inicia la aplicación Spring Boot.
 */
@SpringBootApplication(scanBasePackages = {"edu.eci.arsw.blueprints"})
public class BluePrintsApp {

    public static void main(String[] args) {
        SpringApplication.run(BluePrintsApp.class, args);
    }

}
