import { autorun, observable } from "mobx";
import { DataLoadedList } from "./types/DataLoadedList";
import { DataLoadedListEntry } from "./types/DataLoadedListEntry";
import { DataLoader } from "./types/DataLoader";
import { makeDataLoaded } from "./makeDataLoaded";
import { ObjectManager } from "./types/ObjectManager";
import { request } from "graphql-request";
import { dataLoaded, DataLoadedPropTypes } from "./annotations";

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
  @observable name: string | null = null;
  @observable
  @dataLoaded(DataLoadedPropTypes.ARRAY_LIST_OBJECT, "code")
  countries: Country[] = [];

  constructor(
    id: string,
    list: DataLoadedList<any>,
    objectManager: ObjectManager
  ) {
    super(id, list, objectManager, "code");
    makeDataLoaded(this);
  }
}

class Country extends DataLoadedListEntry {
  @observable name: string | null = null;
  @observable code: string | null = null;
  @observable native: string | null = null;
  @observable phone: string | null = null;
  @observable
  @dataLoaded(DataLoadedPropTypes.LIST_OBJECT, "code")
  continent: Continent | null = null;
  @observable capital: string | null = null;
  @observable currency: string | null = null;
  @observable emoji: string | null = null;
  @observable emojiU: string | null = null;

  constructor(
    id: string,
    list: DataLoadedList<any>,
    objectManager: ObjectManager
  ) {
    super(id, list, objectManager, "code");
    makeDataLoaded(this);
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
