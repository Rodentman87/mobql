import {
  DataLoadedListEntry,
  DataLoader,
  MobQLArrayListObject,
  MobQLListObject,
  ObjectManager,
} from "mobql";
import { createClient } from "@urql/core";
import { DataLoadedListEntryManager } from "../../../dist/dataloaders/DataLoadedListEntryManager";

const client = createClient({
  url: "https://countries.trevorblades.com/graphql",
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

export class Continent extends DataLoadedListEntry {
  name: string | null = null;
  code: string;
  @MobQLArrayListObject("Country")
  countries: Country[] = [];

  constructor(id: string, manager: DataLoadedListEntryManager<any>) {
    super(manager);
    this.code = id;
  }

  getId(): string {
    return this.code;
  }
}

export class Country extends DataLoadedListEntry {
  name: string | null = null;
  code: string;
  native: string | null = null;
  phone: string | null = null;
  @MobQLListObject("Continent")
  continent: Continent | null = null;
  capital: string | null = null;
  currency: string | null = null;
  emoji: string | null = null;
  emojiU: string | null = null;

  constructor(id: string, manager: DataLoadedListEntryManager<any>) {
    super(manager);
    this.code = id;
  }

  getId(): string {
    return this.code;
  }
}

const dataLoader = new MyDataLoader();

const objectManager = new ObjectManager(dataLoader);

objectManager.registerListType(Continent, "continent", "Continent", "code");
objectManager.registerListType(Country, "country", "Country", "code");

export default objectManager;
