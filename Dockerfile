# Multi-stage Dockerfile for CarbonTrack Backend
# Stage 1: Build standalone Spring Boot JAR with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight JRE 17 Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/target/app.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]
