import express from "express";
import { plannerRouter } from "./routes/property_checker";
import { Agenda } from "@hokify/agenda";
import { schedule_run } from "./checker/run_property_checker";
import * as dotenv from "dotenv";
import type { PropertyCheckRun } from "./domain/plan-run";

dotenv.config();

const app = express();
const port = process.env.PORT || 3335;

console.log("Debug output: " + process.env.DEBUG_OUTPUT);
console.log(
	"folder to temporally store the experiment data: " +
		process.env.TEMP_RUN_FOLDERS,
);
console.log(`property checker: ${process.env.PROPERTY_CHECKER}`);
console.log(`val: ${process.env.VAL}`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("", plannerRouter);

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

const mongodbURL =
	process.env.PLANNER_MONGO_DB || "localhost:27017/agenda-property_checker";
console.log("database: " + mongodbURL);

const concurrentRuns = Number(process.env.CONCURRENT_PLANNER_RUNS) || 1;

export const agenda = new Agenda({
	db: { address: mongodbURL, collection: "agendaJobs" },
	processEvery: "5 seconds",
	maxConcurrency: concurrentRuns,
	defaultConcurrency: concurrentRuns,
});

agenda.start().then(
	() => console.log("Job scheduler started!"),
	() => console.log("Job scheduler failed!"),
);

agenda.define("checker call", async (job) => {
	const plan_run = job.attrs.data[1] as PropertyCheckRun;
	console.log("Schedule job: " + plan_run.request.id);
	schedule_run(plan_run, job);
});
