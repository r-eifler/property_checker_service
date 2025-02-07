import express, { type Request, type Response } from "express";
import { agenda } from "..";
import { create_property_check_run } from "../checker/run_property_checker";
import { auth } from "../middleware/auth";
import type { PropertyCheckerRequest } from "../domain/service_communication";
import type { Job } from "@hokify/agenda";

const kill = require("tree-kill");

export const plannerRouter = express.Router();

plannerRouter.get("/:id", auth, async (req: Request, res: Response) => {
	// TODO return status of run with id

	res.status(201).send("TODO");
});

plannerRouter.post("/check", auth, async (req: Request, res: Response) => {
	try {
		const request = req.body as PropertyCheckerRequest;

		console.log(`Property check request: ${request.id}`);

		if (process.env.DEBUG_OUTPUT === "true") {
			console.log(request);
		}

		const refId = request.id;

		const run = create_property_check_run(request);

		res.status(201).send({ id: refId, status: run.status });

		agenda.now("checker call", [refId, run]);
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});

plannerRouter.post("/cancel", auth, async (req: Request, res: Response) => {
	// @ts-ignore
	try {
		const refId = req.body.id;
		console.log(`Cancel: " ${refId}`);

		const jobs = await agenda.jobs({ name: "checker call" });

		// TODO make this better typed
		const cancelJob = jobs.filter(
			(j) => (j as Job<any>).attrs.data[0] === refId,
		)[0] as Job<any>;

		if (cancelJob === undefined) {
			if (process.env.DEBUG_OUTPUT === "true") {
				console.log("Job to cancel does not exist.");
			}
			return res.status(400).send();
		}

		console.log(`Cancel Process: ${cancelJob.attrs.data[2]}`);
		cancelJob.cancel();
		kill(cancelJob.attrs.data[2], "SIGKILL");
		res.status(201).send();
	} catch (err) {
		console.log(err);
		res.status(500).send();
	}
});
