# Stage 1: Build stage with eclipse-temurin Java 21 JDK
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Install bash and dos2unix to ensure wrapper script executes cleanly on Alpine Linux
RUN apk add --no-cache bash

# Copy Maven wrapper and POM first to leverage Docker layer caching
COPY pom.xml mvnw ./
COPY .mvn .mvn

# Ensure wrapper has execution rights and LF line endings
RUN chmod +x ./mvnw && sed -i 's/\r$//' ./mvnw

# Pre-fetch dependencies (offline caching)
RUN ./mvnw dependency:go-offline -B || true

# Copy application source code
COPY src ./src

# Package production executable JAR without running tests during image build
RUN ./mvnw clean package -DskipTests

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
