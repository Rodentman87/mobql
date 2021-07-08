import {
	DataLoadedListEntry,
	DataLoadedListEntryManager,
	DataLoadedObject,
	DataLoader,
	ObjectManager,
} from "../../src";

class TestObj extends DataLoadedObject {
	id: string;
	property1: string | null = null;
	property2: string | null = null;
}

class TestUnregisteredObj extends DataLoadedObject {
	id: string;
	property1: string | null = null;
	property2: string | null = null;
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

class TestUnregisteredListObj extends DataLoadedListEntry {
	id: string;

	constructor(id: string, manager: DataLoadedListEntryManager<any>) {
		super(manager);
		this.id = id;
	}

	getId() {
		return this.id;
	}
}

class Loader extends DataLoader {
	async runQuery(query: string, variables: any) {
		return {};
	}
}

const loader = new Loader();
const objManager = new ObjectManager(loader);

describe("ObjectManager", () => {
	it("should register an object", () => {
		expect(() => {
			objManager.registerObject(TestObj, "test");
		}).not.toThrow();
	});

	it("should throw an error if you try to register the same object twice", () => {
		expect(() => {
			objManager.registerObject(TestObj, "test");
		}).toThrow();
	});

	it("should register a list object", () => {
		expect(() => {
			objManager.registerListType(TestListObj, "test");
		}).not.toThrow();
	});

	it("should throw an error if you try to register the same list twice", () => {
		expect(() => {
			objManager.registerListType(TestListObj, "test");
		}).toThrow();
	});

	it("should return an object if the type is registered", () => {
		expect(typeof objManager.getObject(TestObj)).toBeDefined();
	});

	it("should return a list if the type is registered", () => {
		expect(objManager.getList(TestListObj)).toBeDefined();
	});

	it("should throw an error if you try to get an object or list that hasn't been registered", () => {
		expect(() => {
			objManager.getObject(TestUnregisteredObj);
		}).toThrow();
		expect(() => {
			objManager.getList(TestUnregisteredListObj);
		}).toThrow();
	});
});
