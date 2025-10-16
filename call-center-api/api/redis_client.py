import redis.asyncio as redis
import logging
import re

logger = logging.getLogger(__name__)

class RedisClient:    
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0):
        self._host = host
        self._port = port
        self._db = db
        self.redis: redis.Redis | None = None
    
    async def get(self, key: str) -> str | None:
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {str(e)}")
            return None
    
    async def set(self, key: str, value: str, expire: int | None = None) -> None:
        try:
            if expire is not None and not isinstance(expire, int):
                logger.error(f"Invalid expire value for key {key}: {expire} (must be int or None)")
                raise ValueError("expire must be an integer or None")
            logger.debug(f"Setting Redis key {key} with value length={len(value)} and expire={expire}")
            await self.redis.set(key, value, ex=expire)
        except Exception as e:
            logger.error(f"Redis set error for key {key}: {str(e)}")
            raise

    async def setex(self, key: str, seconds: int, value: str) -> None:
        """Set key to value with expiration time in seconds."""
        try:
            logger.debug(f"Setting Redis key {key} with value length={len(value)} and expire={seconds}")
            await self.redis.setex(key, seconds, value)
        except Exception as e:
            logger.error(f"Redis setex error for key {key}: {str(e)}")
            raise
    
    async def delete(self, key: str) -> None:
        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error for key {key}: {str(e)}")
    
    async def delete_pattern(self, pattern: str) -> None:
        try:
            cursor = 0
            while True:
                cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
                if keys:
                    await self.redis.delete(*keys)
                if cursor == 0:
                    break
        except Exception as e:
            logger.error(f"Redis delete_pattern error for pattern {pattern}: {str(e)}")
    
    async def publish(self, channel: str, message: str) -> None:
        try:
            await self.redis.publish(channel, message)
        except Exception as e:
            logger.error(f"Redis publish error for channel {channel}: {str(e)}")
    
    async def close(self) -> None:
        try:
            await self.redis.close()
        except Exception as e:
            logger.error(f"Redis close error: {str(e)}")

    async def connect(self):
        import redis.asyncio as redis
        self.redis = redis.Redis(
            host=self._host,
            port=self._port,
            db=self._db,
            decode_responses=True,
            max_connections=100,
        )
        # Test connection
        try:
            await self.redis.ping()
        except Exception as e:
            logger.error(f"Redis connection failed: {str(e)}")
            raise

    async def disconnect(self):
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
            self.redis = None

    async def brpop(self, key: str, timeout: int = 0):
        try:
            return await self.redis.brpop(key, timeout=timeout)
        except Exception as e:
            logger.error(f"Redis BRPOP error for key {key}: {str(e)}")
            return None
        
    async def lpush(self, key: str, *values):
        try:
            return await self.redis.lpush(key, *values)
        except Exception as e:
            logger.error(f"Redis LPUSH error for key {key}: {str(e)}")
            return None


redis_client = RedisClient()