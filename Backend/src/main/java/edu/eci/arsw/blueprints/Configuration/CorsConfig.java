package edu.eci.arsw.blueprints.Configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedMethods("GET", "POST","PUT","DELETE")
                        .allowedOrigins("http://localhost:5173", "http://192.168.1.14:5173")
                        .allowCredentials(true)
                        .allowedHeaders("*");
            }
        };
    }
}
