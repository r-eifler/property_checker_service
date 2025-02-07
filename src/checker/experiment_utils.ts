import fs from "node:fs";
import { type PlanningModel, toPDDL_domain, toPDDL_problem } from "../domain/pddl";
import type { PlanProperty } from "../domain/plan_property";
import type { Action } from "../domain/action";

export function setupRunEnvironment(
	model: PlanningModel,
	properties: PlanProperty[],
	plan: Action[],
	expFolder: string,
) {
	fs.mkdirSync(expFolder);

	const domain_path = `${expFolder}/domain.pddl`;
	const problem_path = `${expFolder}/problem.pddl`;
	const model_path = `${expFolder}/model.json`;
	const properties_path = `${expFolder}/properties.json`;
	const plan_path = `${expFolder}/plan.json`;

	fs.writeFileSync(domain_path, toPDDL_domain(model));
	fs.writeFileSync(problem_path, toPDDL_problem(model));
	fs.writeFileSync(model_path, JSON.stringify(model));
	fs.writeFileSync(
		properties_path,
		JSON.stringify({
			plan_properties: properties,
		}),
	);
	fs.writeFileSync(plan_path, JSON.stringify(plan));
}

export function cleanUpRunEnvironment(expFolder: string) {
	fs.rmSync(expFolder, { recursive: true, force: true });
}
