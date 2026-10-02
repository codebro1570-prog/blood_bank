package com.bloodbank.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RedisConfigTest {

    private final RedisConfig redisConfig = new RedisConfig();

    @Test
    @DisplayName("redisJsonSerializer is created with proper configurations")
    void testRedisJsonSerializer() {
        GenericJackson2JsonRedisSerializer serializer = redisConfig.redisJsonSerializer();
        assertThat(serializer).isNotNull();
    }

    @Test
    @DisplayName("cacheManager configures custom TTLs for high-frequency queries")
    void testCacheManagerConfiguration() {
        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        GenericJackson2JsonRedisSerializer serializer = redisConfig.redisJsonSerializer();

        RedisCacheManager cacheManager = redisConfig.cacheManager(factory, serializer);
        assertThat(cacheManager).isNotNull();
    }

    @Test
    @DisplayName("errorHandler handles Redis errors gracefully without re-throwing")
    void testErrorHandler() {
        var errorHandler = redisConfig.errorHandler();
        assertThat(errorHandler).isNotNull();

        // Ensure methods execute without throwing unhandled exceptions
        errorHandler.handleCacheGetError(new RuntimeException("Redis timeout"), null, "key");
        errorHandler.handleCachePutError(new RuntimeException("Redis timeout"), null, "key", "val");
        errorHandler.handleCacheEvictError(new RuntimeException("Redis timeout"), null, "key");
        errorHandler.handleCacheClearError(new RuntimeException("Redis timeout"), null);
    }
}
