import type { Job } from "@hokify/agenda";
import { type ChildProcess, spawn } from "node:child_process";
import type { PropertyCheckRun } from "../domain/plan-run";
import {
	type PropertyCheckerRequest,
	type PropertyCheckerResponse,
	PropertyCheckRunStatus,
} from "../domain/service_communication";
import { cleanUpRunEnvironment, setupRunEnvironment } from "./experiment_utils";

export function create_property_check_run(
	request: PropertyCheckerRequest,
): PropertyCheckRun {
	return {
		request,
		status: PropertyCheckRunStatus.PENDING,
		env_path: `${process.env.TEMP_RUN_FOLDERS}/${request.id}`,
	};
}

export async function schedule_run(run: PropertyCheckRun, job: Job<any>) {
	const request = run.request;

	setupRunEnvironment(
		request.model,
		request.goals,
		request.actions,
		run.env_path,
	);

	const result = await runProcess(run, job);

	sendResults(run, result);

	cleanUpRunEnvironment(run.env_path);
}

function runProcess(
	run: PropertyCheckRun,
	job: Job<any>,
): Promise<string[] | null> {
	return new Promise((resolve, reject) => {
		if (!process.env.PROPERTY_CHECKER) {
			throw Error("Checker not defined.");
		}

		run.status = PropertyCheckRunStatus.RUNNING;

		const args: string[] = [
			process.env.PROPERTY_CHECKER,
			"domain.pddl",
			"problem.pddl",
			"properties.json",
			"model.json",
			"plan.json",
		];

		const options = {
			cwd: run.env_path,
			env: { VAL: process.env.VAL },
		};

		try {
			const checkProcess: ChildProcess = spawn("python3", args, options);

			//store process id so job can be canceled
			job.attrs.data.push(checkProcess.pid);
			job.save();

			// DEBUG output
			if (process.env.DEBUG_OUTPUT === "true") {
				checkProcess.stderr?.on("data", (data) => {
					console.error(`stderr: ${data}`);
				});
			}

			//result is written to stout
			const result: string[] = [];
			checkProcess.stdout?.on("data", (data) => {
				console.log("stdout: " + data);
				const s: string = data.toString();
				const parts = s.split('\n')
				for(const p of parts){
					const trimmed = p.trim();
					if(trimmed.length > 0){
						result.push(trimmed);
					}
				}
			});

			checkProcess.on("close", (code) => {
				switch (code) {
					case 0:
						run.status = PropertyCheckRunStatus.FINISHED;
						break;
					default:
						run.status = PropertyCheckRunStatus.FAILED;
						break;
				}
				if (process.env.DEBUG_OUTPUT === "true") {
					console.log(`ReturnCode: ${code}`);
				}
				return resolve(result);
			});

			checkProcess.on("error", (err) => {
				run.status = PropertyCheckRunStatus.FAILED;
				return reject(null);
			});
		} catch (err) {
			run.status = PropertyCheckRunStatus.FAILED;
			resolve(null);
		}
	});
}

function sendResults(
	run: PropertyCheckRun,
	satisfiedProperties: string[] | null,
) {
	const request = run.request;

	const data: PropertyCheckerResponse = {
		id: request.id,
		status: run.status,
		satisfiedProperties: satisfiedProperties,
	};

	const payload = JSON.stringify(data);

	if (process.env.DEBUG_OUTPUT === "true") {
		console.log("PAYLOAD:");
		console.log(payload);
	}

	const callbackRequest = new Request(run.request.callback, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.SERVICE_KEY}`,
		},
		body: payload,
	});

	fetch(callbackRequest).then(
		(resp) => {
			if (process.env.DEBUG_OUTPUT === "true") {
				console.log(`callback sent: ${run.request.id}`);
				console.log(`got response:  ${resp.status}`);
			}
		},
		(error) => console.log(`Request: ${run.request.id} ${error}`),
	);
}
