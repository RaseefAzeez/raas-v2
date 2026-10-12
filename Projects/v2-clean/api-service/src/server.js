
const express = require("express");
const { operationQueue } = require("./operationQueue");

const app = express();
const PORT = 3000;

app.use(express.json());

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
