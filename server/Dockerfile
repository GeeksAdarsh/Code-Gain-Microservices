# ── Build stage ───────────────────────────────────────────────────────────
# Compiles the Spring Boot app into an executable jar.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
# Cache dependencies first
COPY pom.xml .
RUN mvn -q -e -B dependency:go-offline
# Then build
COPY src ./src
RUN mvn -q -B clean package -DskipTests

# ── Runtime stage ─────────────────────────────────────────────────────────
# Ships the jar PLUS the compilers/interpreters the online judge needs at
# runtime (gcc, g++, javac/java, python3, node) so all 5 languages run.
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc g++ python3 nodejs \
    && ln -sf /usr/bin/python3 /usr/local/bin/python \
    && ( [ -e /usr/bin/node ] || ln -sf /usr/bin/nodejs /usr/local/bin/node ) \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /build/target/*.jar app.jar

# Render/most PaaS inject $PORT; the app reads it via server.port=${PORT:8080}.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -jar app.jar"]
