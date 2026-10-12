
const { Worker } = require("bullmq");

const worker = new Worker(
    "operation-queue",
    async (job) => {
        console.log("Processing job:", job.id);
        console.log("Action:", job.data.action);
        console.log("Instance ID:", job.data.instanceId);

        // Simulate the reboot operation.
        console.log(`Mock reboot started for ${job.data.instanceId}`);

        return {
            status: "success",
            instanceId: job.data.instanceId
        };
    },
    {
        connection: {
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: process.env.REDIS_PORT || 6379
        }
    }
);

worker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
});

worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

console.log("Worker listening on operation-queue");
