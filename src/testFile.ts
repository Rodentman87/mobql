import { autorun } from "mobx";
import { DataLoadedListEntry } from "./dataloaders/DataLoadedListEntry";
import { DataLoader } from "./dataloaders/DataLoader";
import { ObjectManager } from "./dataloaders/ObjectManager";
import { request } from "graphql-request";
import { MobQLArrayListObject, MobQLListObject } from "./annotations";
import { DataLoadedListEntryManager } from "./dataloaders/DataLoadedListEntryManager";

class MyDataLoader extends DataLoader {
  async runQuery(query: string, variables: any): Promise<any> {
    let output;
    try {
      output = await request(
        "https://countries.trevorblades.com/graphql",
        query,
        variables
      );
    } catch (e) {
      console.log(e);
    }
    return { data: output };
  }
}

class Continent extends DataLoadedListEntry {
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

class Country extends DataLoadedListEntry {
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
const continentRepo = objectManager.getList(Continent);
const continentNorthAmerica = continentRepo.get("NA");

autorun(() => {
  console.log(continentNorthAmerica.name);
  console.log(" Countries:");
  continentNorthAmerica.countries.map((country) => {
    console.log("  ", country.code, "-", country.name, country.emoji);
  });
});
