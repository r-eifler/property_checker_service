import type {
	PropertyCheckerRequest,
	PropertyCheckRunStatus,
} from "./service_communication";

export interface PropertyCheckRun {
	request: PropertyCheckerRequest;
	status: PropertyCheckRunStatus;
	env_path: string;
}
