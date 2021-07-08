import { runInAction } from "mobx";
import {
	DataLoadedList,
	DataLoadedListEntry,
	DataLoadedListEntryManager,
	DataLoader,
	ObjectManager,
} from "../../src";

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

const runFn = jest.fn((query: string, variables: any) => {
	return new Promise((resolve) => {
		resolve({ data: {} });
	});
});

class Loader extends DataLoader {
	runQuery = runFn;
}

const loader = new Loader();
const objManager = new ObjectManager(loader);

const list = new DataLoadedList(
	TestListObj,
	loader,
	objManager,
	"",
	"id",
	"ID!"
);

let item1: TestListObj;

const item2Mgr = new DataLoadedListEntryManager(
	"2",
	list,
	objManager,
	TestListObj
);
const item2 = item2Mgr.getChild();

const itemList: TestListObj[] = [];
for (let i = 3; i < 6; i++) {
	const mgr = new DataLoadedListEntryManager(
		`${i}`,
		list,
		objManager,
		TestListObj
	);
	itemList.push(mgr.getChild());
}

describe("DataLoadedList", () => {
	it("should return a new object with the correct ID if the object hasn't been fetched before", () => {
		item1 = list.get("1");

		expect(item1).toBeInstanceOf(TestListObj);
		expect(item1.id).toBe("1");
	});

	it("should return the same object if given an ID of an object that already exists", () => {
		const newItem = list.get("1");

		expect(newItem).toBe(item1);
	});

	it("should set an object when provided", () => {
		list.set("2", item2);

		expect(list.get("2")).toBe(item2);
	});

	it("should set a group of objects", () => {
		list.setAll(itemList);

		for (let i = 3; i < 6; i++) {
			expect(list.get(`${i}`)).toBe(itemList[i - 3]);
		}
	});

	it("should create a graphql request for all needed props", () => {
		runInAction(() => {
			list.addPropsToBeFetched("1", ["prop1"]);
			list.addPropsToBeFetched("2", ["prop1", "prop2"]);
			list.addPropsToBeFetched("3", ["prop1"]);
		});

		expect(runFn.mock.calls[0]).toMatchSnapshot();
	});
});
