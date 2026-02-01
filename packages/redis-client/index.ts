import { createClient, RedisClientType } from "redis";
import "dotenv";

// Declare a singleton variable for the Redis client
let redisClient: RedisClientType | null = null;

// Function to initialize and return the Redis client
const getRedisClient = (): RedisClientType => {
    if (!redisClient) {
        // Create the Redis client if not already created
        const redisUrl = process.env.REDIS_URL;
        redisClient = createClient({ url: redisUrl });

        // Error handling for Redis connection
        redisClient.on("error", (err) => {
            console.error("Redis connection error:", err);
        });

        // Connect the client once
        redisClient.connect().then(() => {
            console.log("Redis client connected successfully.");
        }).catch((err) => {
            console.error("Error connecting to Redis:", err);
        });
    }

    return redisClient;
};

export default getRedisClient;
