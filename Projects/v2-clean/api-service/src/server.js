
const Redis = require("ioredis");
const express = require("express");
const { operationQueue } = require("./operationQueue");
const {
    authenticateToken,
    requireAdmin
} = require("./middleware/auth");

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

// Public health endpoints for Kubernetes probes.
app.get("/health/live", (req, res) => {
    res.status(200).json({
        status: "alive"
    });
});

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

// Reboot requests require a valid Cognito access token.
app.post("/reboot", authenticateToken, async (req, res) => {
    try {
        const { instanceId } = req.body;

        if (!instanceId) {
            return res.status(400).json({
                error: "instanceId is required"
            });
        }

        const job = await operationQueue.add("reboot", {
            action: "REBOOT",
            instanceId,
            requestedBy: req.user.id
        });

        res.status(202).json({
            message: "Reboot job accepted",
            jobId: job.id,
            instanceId
        });
    } catch (error) {
        console.error("Failed to enqueue job:", error.message);

        res.status(500).json({
            error: "Failed to enqueue job"
        });
    }
});

// Users can view the status of their own jobs.
// Administrators can also view jobs belonging to other users.
app.get(
    "/jobs/:jobId/status",
    authenticateToken,
    async (req, res) => {
        try {
            const job = await operationQueue.getJob(req.params.jobId);

            if (!job) {
                return res.status(404).json({
                    error: "Job not found"
                });
            }

            const isAdmin = req.user.groups.includes("RaaS-Admins");
            const isOwner = job.data.requestedBy === req.user.id;

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    error: "You are not authorized to view this job"
                });
            }

            const status = await job.getState();

            return res.status(200).json({
                jobId: job.id,
                instanceId: job.data.instanceId,
                action: job.data.action,
                status,
                timestamp: job.timestamp,
                finishedOn: job.finishedOn ?? null,
                result:
                    status === "completed"
                        ? job.returnvalue
                        : undefined,
                error:
                    status === "failed"
                        ? job.failedReason
                        : undefined
            });
        } catch (error) {
            console.error("Failed to retrieve job status:", error.message);

            return res.status(500).json({
                error: "Failed to retrieve job status"
            });
        }
    }
);

// Job history is restricted to members of the RaaS-Admins group.
app.get("/jobs", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const states = [
            "waiting",
            "active",
            "completed",
            "failed",
            "delayed",
            "waiting-children",
            "paused"
        ];

        const jobs = await operationQueue.getJobs(
            states,
            0,
            49,
            false
        );

        const jobHistory = await Promise.all(
            jobs.map(async (job) => {
                const status = await job.getState();

                return {
                    jobId: job.id,
                    instanceId: job.data.instanceId,
                    action: job.data.action,
                    status,
                    timestamp: job.timestamp,
                    finishedOn: job.finishedOn ?? null,
                    result:
                        status === "completed"
                            ? job.returnvalue
                            : undefined,
                    error:
                        status === "failed"
                            ? job.failedReason
                            : undefined
                };
            })
        );

        jobHistory.sort(
            (a, b) => b.timestamp - a.timestamp
        );

        res.status(200).json({
            count: jobHistory.length,
            jobs: jobHistory
        });
    } catch (error) {
        console.error("Failed to retrieve job history:", error.message);

        res.status(500).json({
            error: "Failed to retrieve job history"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on port ${PORT}`);
});
