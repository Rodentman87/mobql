import { DataLoadedList } from "./DataLoadedList";
import { DataLoadedListEntry } from "./DataLoadedListEntry";
import { DataLoadedObject } from "./DataLoadedObject";
import { DataLoader } from "./DataLoader";

enum ObjectType {
  LIST,
  OBJECT,
}

type ObjectNameAndType = {
  objectName: string;
  type: ObjectType;
};

export class ObjectManager {
  private listRepos: Map<string, DataLoadedList<any>>;
  private objectRepos: Map<string, DataLoadedObject>;
  private typenameToObjectName: Map<string, ObjectNameAndType>;
  private objectNameToIdName: Map<string, string>;
  private dataLoader: DataLoader;

  constructor(dataLoader: DataLoader) {
    this.listRepos = new Map();
    this.objectRepos = new Map();
    this.typenameToObjectName = new Map();
    this.objectNameToIdName = new Map();
    this.dataLoader = dataLoader;
  }

  /**
   * Registers a new DataLoadedList, providing a typename is only necessary if your object has a different name from the gql __typename
   *
   * @param object The DataLoadedListEntry that you want to register
   * @param queryName The name of the query to grab a single instance of this object, given an id
   * @param typename If the gql __typename is different from the name of this class, then provide it here
   */
  registerListType<T extends typeof DataLoadedListEntry>(
    object: T,
    queryName: string,
    typename?: string,
    idName: string = "id"
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
        queryName,
        this
      )
    );
    this.typenameToObjectName.set(typename || object.name, {
      objectName: object.name,
      type: ObjectType.LIST,
    });
    this.objectNameToIdName.set(object.name, idName);
  }

  registerObject<T extends DataLoadedObject>(
    object: new (...args: any[]) => T,
    queryName: string,
    typename?: string
  ) {
    if (this.objectRepos.has(object.name))
      throw new Error(`Already registered type ${object.name}`);
    this.objectRepos.set(object.name, new object(queryName, this.dataLoader));
    this.typenameToObjectName.set(typename || object.name, {
      objectName: object.name,
      type: ObjectType.OBJECT,
    });
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

  getFromTypename(typename: string) {
    const obj = this.typenameToObjectName.get(typename);
    if (!obj)
      throw new Error(
        `No object has been registered for the typename ${typename}`
      );
    if (obj.type === ObjectType.LIST) {
      return this.listRepos.get(obj.objectName)!;
    } else {
      return this.objectRepos.get(obj.objectName)!;
    }
  }

  getId<T extends DataLoadedObject>(object: new (...args: any[]) => T) {
    const idName = this.objectNameToIdName.get(object.name);
    if (!idName)
      throw new Error(`No object registered for name ${object.name}`);
    return idName;
  }

  getIdFromTypename(name: string) {
    const objName = this.typenameToObjectName.get(name);
    if (!objName)
      throw new Error(`No object with __typename ${name} registered`);
    const idName = this.objectNameToIdName.get(objName.objectName);
    return idName || "id";
  }
}
