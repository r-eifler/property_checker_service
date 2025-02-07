import type { Action } from "./action";
import type { PlanningModel } from "./pddl";
import type { PlanProperty } from "./plan_property";

export enum PropertyCheckRunStatus {
	PENDING = "PENDING",
	RUNNING = "RUNNING",
	FAILED = "FAILED",
	FINISHED = "FINISHED",
	CANCELED = "CANCELED",
}

export interface PropertyCheckerRequest {
	id: string;
	callback: string;
	model: PlanningModel;
	goals: PlanProperty[];
	actions: Action[];
}

export interface PropertyCheckerResponse {
	id: string;
	status: PropertyCheckRunStatus;
	satisfiedProperties: string[] | null;
}
