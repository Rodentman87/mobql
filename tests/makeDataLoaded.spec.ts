import {
	makeDataLoaded,
	DataLoadedObject,
	DataLoadedObjectManager,
	DataLoadedListEntry,
	DataLoadedListEntryManager,
	DataLoader,
	NestedObject,
	ObjectManager,
} from "../src";
import { isObservableProp } from "mobx";
import {
	MobQLArrayListObject,
	MobQLIgnore,
	MobQLListObject,
	MobQLNested,
	MobQLObject,
	MobQLScalar,
} from "../src/annotations";

class Loader extends DataLoader {
	runQuery(query: string, variables: any): Promise<any> {
		console.log(query, variables);
		return new Promise((resolve) => {
			resolve({ data: {} });
		});
	}
}

class TestListObj extends DataLoadedListEntry {
	id: string;

	constructor(id: string, manager: DataLoadedListEntryManager<any>) {
		super(manager);
		this.id = id;
	}

	getId() {
		return this.id;
	}
}

class TestOtherObj extends DataLoadedObject {
	prop1: string | null;
}

class TestNested extends NestedObject {
	prop1: string | null;
}

class TestObj extends DataLoadedObject {
	implicitScalar: number | null;

	@MobQLScalar()
	explicitScalar: number | null;

	@MobQLListObject("TestListObj")
	listObj: TestListObj | null;

	@MobQLArrayListObject("TestListObj")
	arrayListObj: TestListObj[] = [];

	@MobQLObject()
	obj: TestOtherObj;

	@MobQLNested()
	nested: TestNested = new TestNested();

	@MobQLIgnore()
	ignored: string;
}

describe("makeDataLoaded", () => {
	it("makes each property observable unless it has an @MobQLIgnore annotation", () => {
		const loader = new Loader();
		const objManager = new ObjectManager(loader);
		const manager = new DataLoadedObjectManager(
			"",
			loader,
			objManager,
			TestObj
		);
		const object = new TestObj(manager);

		makeDataLoaded(object);

		expect(isObservableProp(object, "implicitScalar")).toBe(true);
		expect(isObservableProp(object, "explicitScalar")).toBe(true);
		expect(isObservableProp(object, "listObj")).toBe(true);
		expect(isObservableProp(object, "arrayListObj")).toBe(true);
		expect(isObservableProp(object, "obj")).toBe(true);
		expect(isObservableProp(object, "nested")).toBe(true);
		expect(isObservableProp(object, "ignored")).toBe(false);
	});

	it("makes nested objects dataloaded", () => {
		const loader = new Loader();
		const objManager = new ObjectManager(loader);
		const manager = new DataLoadedObjectManager(
			"",
			loader,
			objManager,
			TestObj
		);
		const object = new TestObj(manager);

		makeDataLoaded(object);

		expect(isObservableProp(object.nested, "prop1")).toBe(true);
	});
});
