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
    if (this.listRepos.has(object.name))
      throw new Error(`Already registered type ${object.name}`);
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

  registerObject<T extends DataLoadedObject>(
    object: new (...args: any[]) => T,
    queryName: string
  ) {
    if (this.objectRepos.has(object.name))
      throw new Error(`Already registered type ${object.name}`);
    this.objectRepos.set(object.name, new object(queryName, this.dataLoader));
  }

  getList<T extends DataLoadedListEntry>(
    object: new (...args: any[]) => T
  ): DataLoadedList<T> {
    const repo = this.listRepos.get(object.name);
    if (repo) return repo;
    throw new Error(
      `The type ${object.name} has not been registered, make sure you register it before you try to get its repo`
    );
  }

  getObject<T extends DataLoadedObject>(object: new (...args: any[]) => T): T {
    const repo = this.objectRepos.get(object.name);
    if (repo) return repo as T;
    throw new Error(
      `The type ${object.name} has not been registered, make sure you register it before you try to get its repo`
    );
  }
}
