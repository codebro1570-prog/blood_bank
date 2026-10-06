# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Build application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage with lightweight eclipse-temurin Java 21 JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root system group and user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy executable jar from builder stage and assign ownership
COPY --from=builder --chown=appuser:appgroup /app/target/*.jar app.jar

# Switch to non-root user for security best practices
USER appuser

# Default configuration (supports dynamic cloud PORT or standard SERVER_PORT)
ENV SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
