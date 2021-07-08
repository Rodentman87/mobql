import { autorun } from "mobx";
import {
	DataLoadedList,
	DataLoadedListEntry,
	DataLoadedListEntryManager,
	DataLoader,
	ObjectManager,
} from "../../src";

class TestListObj extends DataLoadedListEntry {
	id: string;
	property1: string | null = null;
	property2: string | null = null;

	constructor(id: string, manager: DataLoadedListEntryManager<any>) {
		super(manager);
		this.id = id;
	}

	getId() {
		return this.id;
	}
}

const runFn = jest.fn((query: string, variables: any) => {
	if (query.includes("property2")) {
		return new Promise((resolve) => {
			setTimeout(() => resolve({ data: { o2: { property2: "test" } } }), 2000);
		});
	} else {
		return new Promise((resolve) => {
			setTimeout(() => resolve({ data: { o2: { property1: "test" } } }), 2000);
		});
	}
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
	"testListObj",
	"id",
	"ID!"
);

list.addPropsToBeFetched = jest.fn(list.addPropsToBeFetched);

const item = list.get("2");

const loadFn = jest.fn();
autorun(() => {
	loadFn(item.getManager().isLoadingProps);
});

describe("DataLoadedListEntry", () => {
	it("should fetch properties when they first become observed", () => {
		autorun(() => {
			item.property1;
		});

		expect(runFn.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      "query ($id2: ID!) { o2: testListObj (id: $id2) { property1 } }",
      Object {
        "id2": "2",
      },
    ]
  `);
	});

	it("manager.isLoadingProps should be true when the object has properties loading", async () => {
		await new Promise((resolve) => {
			autorun(() => {
				if (item.property2) resolve(true);
			});
		});

		expect(loadFn).toHaveBeenNthCalledWith(1, false);
		expect(loadFn).toHaveBeenNthCalledWith(2, true);
	});
});
