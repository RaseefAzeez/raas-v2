
const Redis = require("ioredis");
const express = require("express");
const { operationQueue } = require("./operationQueue");

const app = express();
const PORT = 3000;

const healthRedis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    lazyConnect: true,
    connectTimeout: 1000,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 100, 1000)
});

healthRedis.on("error", (error) => {
    console.error("Redis health-check error:", error.message);
});

app.use(express.json());

// Liveness: is the API process responding?
app.get("/health/live", (req, res) => {
    res.status(200).json({
        status: "alive"
    });
});

// Readiness: can the API reach Redis?
app.get("/health/ready", async (req, res) => {
    let timeout;

    try {
        const ping = healthRedis.ping();

        await Promise.race([
            ping,
            new Promise((_, reject) => {
                timeout = setTimeout(
                    () => reject(new Error("Redis health check timed out")),
                    1500
                );
            })
        ]);

        res.status(200).json({
            status: "ready",
            redis: "available"
        });
    } catch (error) {
        res.status(503).json({
            status: "not_ready",
            redis: "unavailable"
        });
    } finally {
        clearTimeout(timeout);
    }
});


app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy"
    });
});

app.post("/reboot", async (req, res) => {
    try {
        const { instanceId } = req.body;

        if (!instanceId) {
            return res.status(400).json({
                error: "instanceId is required"
            });
        }

        const job = await operationQueue.add("reboot", {
            action: "REBOOT",
            instanceId: instanceId
        });

        res.status(202).json({
            message: "Reboot job accepted",
            jobId: job.id,
            instanceId: instanceId
        });
    } catch (error) {
        console.error("Failed to enqueue job:", error.message);

        res.status(500).json({
            error: "Failed to enqueue job"
        });
    }
});


app.get("/jobs/:jobId", async (req, res) => {
    try {
        const jobId = req.params.jobId;

        const job = await operationQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({
                error: "Job not found",
                jobId: jobId
            });
        }

        const status = await job.getState();

        res.status(200).json({
            jobId: job.id,
            status: status,
            result: status === "completed" ? job.returnvalue : undefined,
            error: status === "failed" ? job.failedReason : undefined
        });
    } catch (error) {
        console.error("Failed to retrieve job status:", error.message);

        res.status(500).json({
            error: "Failed to retrieve job status"
        });
    }
});


app.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on port ${PORT}`);
});
