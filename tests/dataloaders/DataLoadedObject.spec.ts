import { autorun } from "mobx";
import {
	DataLoadedObject,
	DataLoadedObjectManager,
	DataLoader,
	ObjectManager,
} from "../../src";

class TestObj extends DataLoadedObject {
	id: string;
	property1: string | null = null;
	property2: string | null = null;
}

const runFn = jest.fn((query: string, variables: any) => {
	if (query.includes("property2")) {
		return new Promise((resolve) => {
			setTimeout(
				() => resolve({ data: { testObj: { property2: "test" } } }),
				2000
			);
		});
	} else {
		return new Promise((resolve) => {
			setTimeout(
				() => resolve({ data: { testObj: { property1: "test" } } }),
				2000
			);
		});
	}
});

class Loader extends DataLoader {
	runQuery = runFn;
}

const loader = new Loader();
const objManager = new ObjectManager(loader);

const mgr = new DataLoadedObjectManager("testObj", loader, objManager, TestObj);
const object = mgr.getChild();

const loadFn = jest.fn();
autorun(() => {
	loadFn(mgr.isLoadingProps);
});

describe("DataLoadedObject", () => {
	it("should fetch properties when they first become observed", () => {
		autorun(() => {
			object.property1;
		});

		expect(runFn.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      "query  { testObj  { property1 } }",
      Object {},
    ]
  `);
	});

	it("manager.isLoadingProps should be true when the object has properties loading", async () => {
		await new Promise((resolve) => {
			autorun(() => {
				if (object.property2) resolve(true);
			});
		});

		expect(loadFn).toHaveBeenNthCalledWith(1, false);
		expect(loadFn).toHaveBeenNthCalledWith(2, true);
	});
});
