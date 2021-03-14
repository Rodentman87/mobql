import { DataLoadedList } from "./DataLoadedList";
import { DataLoadedListEntry } from "./DataLoadedListEntry";
import { DataLoadedObject } from "./DataLoadedObject";
import { DataLoader } from "./DataLoader";

export class ObjectManager {
  private listRepos: Map<string, DataLoadedList<any>>;
  private objectRepos: Map<string, DataLoadedObject>;
  private dataLoader: DataLoader;

  constructor(dataLoader: DataLoader) {
    this.listRepos = new Map();
    this.objectRepos = new Map();
    this.dataLoader = dataLoader;
  }

  registerListType<T extends typeof DataLoadedListEntry>(
    object: T,
    queryName: string
  ) {
    this.listRepos.set(
      object.name,
      new DataLoadedList(
        (object as unknown) as new (
          id: string,
          list: DataLoadedList<typeof object.prototype>
        ) => typeof object.prototype,
        this.dataLoader,
        queryName
      )
    );
  }

  getList<T extends typeof DataLoadedListEntry>(object: T) {
    const repo = this.listRepos.get(object.name);
    if (repo) return repo as DataLoadedList<typeof object.prototype>;
    throw new Error(
      "This object has not been registered, make sure you register it before you try to get its repo"
    );
  }

  getObject<T extends typeof DataLoadedObject>(object: T) {
    const repo = this.objectRepos.get(object.name);
    if (repo) return repo;
    throw new Error(
      "This object has not been registered, make sure you register it before you try to get its repo"
    );
  }
}
