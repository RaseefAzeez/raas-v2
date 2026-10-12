
const { Queue } = require("bullmq");

const operationQueue = new Queue("operation-queue", {
    connection: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379
    }
});

module.exports = { operationQueue };
