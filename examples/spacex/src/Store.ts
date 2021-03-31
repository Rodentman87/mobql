import {
  DataLoadedListEntry,
  DataLoadedObject,
  DataLoader,
  MobQLNested,
  NestedObject,
  ObjectManager,
} from "mobql";
import { createClient } from "@urql/core";
import { DataLoadedListEntryManager } from "../../../dist/dataloaders/DataLoadedListEntryManager";

const client = createClient({
  url: "https://api.spacex.land/graphql/",
});

class MyDataLoader extends DataLoader {
  async runQuery(query: string, variables: any): Promise<any> {
    let output;
    try {
      output = await client.query(query, variables).toPromise();
    } catch (e) {
      console.log(e);
    }
    return output;
  }
}

export class Dragon extends DataLoadedListEntry {
  id: string;
  crew_capacity: number | null = null;
  description: string | null = null;
  active: boolean | null = null;
  @MobQLNested()
  diameter: DragonDiameter;

  constructor(id: string, manager: DataLoadedListEntryManager<any>) {
    super(manager);
    this.id = id;
    this.diameter = new DragonDiameter();
  }

  getId(): string {
    return this.id;
  }
}

export class DragonDiameter extends NestedObject {
  feet: number | null = null;
  meters: number | null = null;
}

export class Company extends DataLoadedObject {
  ceo: string | null = null;
  coo: string | null = null;
}

const dataLoader = new MyDataLoader();

const objectManager = new ObjectManager(dataLoader);

objectManager.registerListType(Dragon, "dragon", "Dragon");
objectManager.registerObject(Company, "company");

export default objectManager;
