import { autorun, observable } from "mobx";
import { DataLoadedList } from "./DataLoadedList";
import { DataLoadedListEntry } from "./DataLoadedListEntry";
import { DataLoader } from "./DataLoader";
import { makeDataLoaded } from "./makeDataMarkers";
import { ObjectManager } from "./ObjectManager";
import { request } from "graphql-request";

class MyDataLoader extends DataLoader {
  runQuery(query: string, variables: any): Promise<any> {
    return request("https://api.spacex.land/graphql/", query, variables);
  }
}

class Dragon extends DataLoadedListEntry {
  @observable crew_capacity: number | null = null;
  @observable active: boolean | null = null;

  constructor(id: string, list: DataLoadedList<any>) {
    super(id, list);
    makeDataLoaded(this);
  }
}

const dataLoader = new MyDataLoader();

const objectManager = new ObjectManager(dataLoader);
objectManager.registerListType(Dragon, "dragon");
const dragonRepo = objectManager.getList(Dragon);

const dragon1 = dragonRepo.get("dragon1");

autorun(() => {
  console.log(`Dragon 1:
  Crew Cap: ${dragon1.crew_capacity}
  `);
});
