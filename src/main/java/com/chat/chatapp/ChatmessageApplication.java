package com.chat.chatapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class ChatmessageApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ChatmessageApplication.class);
        app.addListeners((ApplicationListener<ApplicationEnvironmentPreparedEvent>) event ->
                requireDbCredentials(event.getEnvironment()));
        app.run(args);
    }

    /**
     * Spring Boot leaves an unresolved ${PLACEHOLDER} as literal text in datasource settings,
     * which produces a confusing "Access denied for user '${DB_USERNAME}'" error.
     * Fail early with a clear message instead.
     */
    private static void requireDbCredentials(Environment env) {
        for (String key : new String[] {"spring.datasource.username", "spring.datasource.password"}) {
            String value = null;
            try {
                value = env.getProperty(key);
            } catch (IllegalArgumentException ignored) {
                // unresolved placeholder -> treated as missing below
            }
            if (value == null || value.isBlank()) {
                throw new IllegalStateException(
                        "Database credentials are not configured (" + key + " is missing). "
                        + "Set the DB_USERNAME and DB_PASSWORD environment variables, "
                        + "or for local development activate the 'local' profile "
                        + "(--spring.profiles.active=local / SPRING_PROFILES_ACTIVE=local).");
            }
        }
    }
}
