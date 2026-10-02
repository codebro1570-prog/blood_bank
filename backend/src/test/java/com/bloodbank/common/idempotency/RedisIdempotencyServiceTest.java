package com.bloodbank.common.idempotency;

import com.bloodbank.common.enums.RequestPriority;
import com.bloodbank.common.enums.RequestStatus;
import com.bloodbank.request.dto.RequestResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisIdempotencyServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private ObjectMapper objectMapper;
    private RedisIdempotencyService idempotencyService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        idempotencyService = new RedisIdempotencyService(redisTemplate, objectMapper, true, 24);
    }

    @Test
    @DisplayName("buildHospitalKey formats key correctly")
    void testBuildHospitalKey() {
        String key = idempotencyService.buildHospitalKey(42L, "req-xyz-123");
        assertThat(key).isEqualTo("idempotency:hospital:42:req-xyz-123");
    }

    @Test
    @DisplayName("acquireLock returns true when setIfAbsent succeeds")
    void testAcquireLockSuccess() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("lock:hospital:42:k1"), eq("LOCKED"), any(Duration.class)))
                .thenReturn(Boolean.TRUE);

        boolean acquired = idempotencyService.acquireLock("lock:hospital:42:k1", Duration.ofSeconds(30));
        assertThat(acquired).isTrue();
    }

    @Test
    @DisplayName("acquireLock returns false when setIfAbsent fails (already locked)")
    void testAcquireLockFail() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("lock:hospital:42:k1"), eq("LOCKED"), any(Duration.class)))
                .thenReturn(Boolean.FALSE);

        boolean acquired = idempotencyService.acquireLock("lock:hospital:42:k1", Duration.ofSeconds(30));
        assertThat(acquired).isFalse();
    }

    @Test
    @DisplayName("releaseLock deletes the lock key from Redis")
    void testReleaseLock() {
        idempotencyService.releaseLock("lock:hospital:42:k1");
        verify(redisTemplate).delete("lock:hospital:42:k1");
    }

    @Test
    @DisplayName("cacheResponse saves response with default TTL")
    void testCacheResponse() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        RequestResponse response = new RequestResponse(
                1L, "REQ-001", new RequestResponse.HospitalRef(10L, "City Hospital"),
                "A+", 2, RequestPriority.NORMAL, RequestStatus.PENDING,
                Instant.now(), null, null, Instant.now(), null, Collections.emptyList()
        );

        idempotencyService.cacheResponse("idempotency:hospital:10:k1", response);

        verify(valueOperations).set(eq("idempotency:hospital:10:k1"), eq(response), eq(Duration.ofHours(24)));
    }

    @Test
    @DisplayName("getCachedResponse returns empty when key not in Redis")
    void testGetCachedResponseNotFound() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("idempotency:hospital:10:k1")).thenReturn(null);

        Optional<RequestResponse> result = idempotencyService.getCachedResponse("idempotency:hospital:10:k1", RequestResponse.class);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getCachedResponse returns typed response when present")
    void testGetCachedResponseFound() {
        RequestResponse response = new RequestResponse(
                1L, "REQ-001", new RequestResponse.HospitalRef(10L, "City Hospital"),
                "A+", 2, RequestPriority.NORMAL, RequestStatus.PENDING,
                Instant.now(), null, null, Instant.now(), null, Collections.emptyList()
        );

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("idempotency:hospital:10:k1")).thenReturn(response);

        Optional<RequestResponse> result = idempotencyService.getCachedResponse("idempotency:hospital:10:k1", RequestResponse.class);
        assertThat(result).isPresent();
        assertThat(result.get().requestNo()).isEqualTo("REQ-001");
    }

    @Test
    @DisplayName("fail-open when Redis throws an exception during lock acquisition")
    void testFailOpenOnRedisException() {
        when(redisTemplate.opsForValue()).thenThrow(new RuntimeException("Redis connection refused"));

        boolean acquired = idempotencyService.acquireLock("lock:hospital:42:k1", Duration.ofSeconds(30));
        // Should fail open (return true) to allow DB constraints to handle safety without failing user
        assertThat(acquired).isTrue();
    }
}
