export interface PDDLType {
	name: string;
	parent: string;
}

export interface PDDLObject {
	name: string;
	type: string;
}

export interface PDDLPredicate {
	name: string;
	negated: boolean;
	parameters: PDDLObject[];
}

export interface PDDLFact {
	name: string;
	arguments: string[];
	negated: boolean;
}

export interface PDDLFunctionAssignment {
	name: string;
	arguments: string[];
	value: number;
}

export interface PDDLAction {
	name: string;
	parameters: PDDLObject[];
	precondition: PDDLFact[];
	effect: PDDLFact[];
}

export interface PlanningDomain {
	constants: {
		name: string;
		type: string | undefined;
	}[];
	types: PDDLType[];
	predicates: PDDLPredicate[];
	actions: PDDLAction[];
}

export interface PlanningProblem {
	objects: {
		name: string;
		type: string | undefined;
	}[];
	initial: (PDDLFact | PDDLFunctionAssignment)[];
	goal: PDDLFact[];
}

export interface PlanningModel extends PlanningDomain, PlanningProblem {}

export function toPDDL_domain(model: PlanningModel): string {
	// domain
	let d = "(define (domain run)\n";
	d += "(:requirements :typing :action-costs)\n";

	d +=
		"(:types\n" +
		model.types
			.filter((t) => t.name != "object")
			.map(
				(t) =>
					"\t\t" +
					t.name +
					" - " +
					(t.parent && t.parent != "TODO" ? t.parent : "object"),
			)
			.join("\n") +
		"\n)\n";

	if (!!model.constants && model.constants.length > 0) {
		d +=
			"(:constants \n" +
			model.constants.map((o) => "\t" + o.name + " - " + o.type).join("\n") +
			"\n)\n";
	}

	d +=
		"(:predicates \n" +
		model.predicates
			.map(
				(pred) =>
					"\t(" +
					pred.name +
					" " +
					pred.parameters
						.map((param) => param.name + " - " + param.type)
						.join(" ") +
					")",
			)
			.join("\n") +
		"\t\n)\n";

	d += model.actions
		.map(
			(a) =>
				"(:action " +
				a.name +
				"\n\t:parameters (" +
				a.parameters.map((p) => p.name + " - " + p.type).join(" ") +
				")\n" +
				"\t:precondition (and \n" +
				a.precondition
					.map((p) =>
						p.negated
							? "\t\t" + "(not (" + p.name + " " + p.arguments.join(" ") + "))"
							: "\t\t" + "(" + p.name + " " + p.arguments.join(" ") + ")",
					)
					.join("\n") +
				"\t)\n" +
				"\t:effect (and \n" +
				a.effect
					.map((p) =>
						p.negated
							? "\t\t" + "(not (" + p.name + " " + p.arguments.join(" ") + "))"
							: "\t\t" + "(" + p.name + " " + p.arguments.join(" ") + ")",
					)
					.join("\n") +
				"\n\t)\n)",
		)
		.join("\n");

	d += "\n)";

	return d;
}

export function toPDDL_problem(model: PlanningModel): string {
	// problem
	let p = "(define (problem p1)\n";
	p += "(:domain run)\n";
	p +=
		"(:objects \n" +
		model.objects.map((o) => "\t" + o.name + " - " + o.type).join("\n") +
		"\n)\n";
	p +=
		"(:init\n " +
		model.initial
			.map((f) => "\t(" + f.name + " " + f.arguments.join(" ") + ")")
			.join("\n") +
		"\n)\n";
	p +=
		"(:goal (and \n" +
		model.goal
			.map((p) => "\t(" + p.name + " " + p.arguments.join(" ") + ")")
			.join("\n") +
		")\n";
	p += "))";

	return p;
}
