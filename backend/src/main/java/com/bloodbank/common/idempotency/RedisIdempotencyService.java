package com.bloodbank.common.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
public class RedisIdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(RedisIdempotencyService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final Duration defaultTtl;

    public RedisIdempotencyService(
            RedisTemplate<String, Object> redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.redis.enabled:true}") boolean enabled,
            @Value("${app.redis.idempotency-ttl-hours:24}") int ttlHours) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.defaultTtl = Duration.ofHours(ttlHours);
    }

    public String buildHospitalKey(Long hospitalId, String idempotencyKey) {
        return "idempotency:hospital:" + hospitalId + ":" + idempotencyKey;
    }

    public String buildLockKey(Long hospitalId, String idempotencyKey) {
        return "lock:hospital:" + hospitalId + ":" + idempotencyKey;
    }

    /**
     * Try to acquire a short-lived distributed lock to prevent duplicate concurrent
     * requests hitting multiple backend instances simultaneously.
     */
    public boolean acquireLock(String lockKey, Duration ttl) {
        if (!enabled) return true;
        try {
            Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", ttl);
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            log.warn("Failed to acquire distributed lock for key '{}' in Redis: {}", lockKey, e.getMessage());
            return true; // fail-open to let database constraints handle safety
        }
    }

    public void releaseLock(String lockKey) {
        if (!enabled) return;
        try {
            redisTemplate.delete(lockKey);
        } catch (Exception e) {
            log.warn("Failed to release distributed lock for key '{}' in Redis: {}", lockKey, e.getMessage());
        }
    }

    /**
     * Retrieve cached response for an idempotency key.
     */
    public <T> Optional<T> getCachedResponse(String key, Class<T> responseType) {
        if (!enabled) return Optional.empty();
        try {
            Object raw = redisTemplate.opsForValue().get(key);
            if (raw == null) {
                return Optional.empty();
            }
            if (responseType.isInstance(raw)) {
                return Optional.of(responseType.cast(raw));
            }
            // In case Jackson deserialized into a Map/Node
            T converted = objectMapper.convertValue(raw, responseType);
            return Optional.ofNullable(converted);
        } catch (Exception e) {
            log.warn("Failed to get cached idempotency response from Redis for key '{}': {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Store the completed response in Redis with TTL.
     */
    public void cacheResponse(String key, Object response) {
        cacheResponse(key, response, defaultTtl);
    }

    public void cacheResponse(String key, Object response, Duration ttl) {
        if (!enabled || response == null) return;
        try {
            redisTemplate.opsForValue().set(key, response, ttl);
        } catch (Exception e) {
            log.warn("Failed to cache idempotency response in Redis for key '{}': {}", key, e.getMessage());
        }
    }
}
