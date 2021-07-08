import { action, autorun, makeObservable, observable } from "mobx";
import { DataLoadedListEntry } from "./DataLoadedListEntry";
import { DataLoader } from "./DataLoader";
import * as gql from "gql-query-builder";
import IQueryBuilderOptions from "gql-query-builder/build/IQueryBuilderOptions";
import { ObjectManager } from "./ObjectManager";
import { makeDataLoaded } from "../makeDataLoaded";
import { DataLoadedListEntryManager } from "./DataLoadedListEntryManager";

export class DataLoadedList<T extends DataLoadedListEntry> {
  @observable private objects: Map<string, T>;
  @observable private propsToBeFetched: Map<string, any[]>;
  private dataLoader: DataLoader;
  private queryName: string;
  private objectManager: ObjectManager;
  private instanceConstructor: new (
    id: string,
    manager: DataLoadedListEntryManager<any>
  ) => T;
  private idName: string;
  private idType: string;

  constructor(
    ctor: new (id: string, manager: DataLoadedListEntryManager<any>) => T,
    dataLoader: DataLoader,
    objectManager: ObjectManager,
    queryName: string,
    idName: string,
    idType: string
  ) {
    this.objects = new Map();
    this.propsToBeFetched = new Map();
    this.dataLoader = dataLoader;
    this.queryName = queryName;
    this.objectManager = objectManager;
    this.idName = idName;
    this.idType = idType;
    this.instanceConstructor = ctor;
    makeObservable(this);
    // Create the observer that fetches the data whenever new props need to be loaded
    autorun(() => {
      if (this.propsToBeFetched.size < 1) return; // Only fetch props if there's actually props to be fetched
      this.fetchProps();
      this.clearPropsToBeFetched();
    });
  }

  get(id: string) {
    if (this.objects.has(id)) {
      return this.objects.get(id)!;
    } else {
      const newObject: T = new DataLoadedListEntryManager(
        id,
        this,
        this.objectManager,
        this.instanceConstructor
      ).getChild();
      makeDataLoaded(newObject);
      this.objects.set(id, newObject);
      return newObject;
    }
  }

  @action
  set(id: string, object: T) {
    this.objects.set(id, object);
  }

  @action
  setAll(objects: T[]) {
    objects.forEach((o: T) => {
      const id = o.getId();
      this.objects.set(id, o);
    });
  }

  addPropsToBeFetched(id: string, props: string[]) {
    if (this.propsToBeFetched.has(id)) {
      const old = this.propsToBeFetched.get(id);
      old!.push(...props);
      this.propsToBeFetched.set(id, [...new Set(old)]);
    } else {
      this.propsToBeFetched.set(id, props);
    }
  }

  @action
  clearPropsToBeFetched() {
    this.propsToBeFetched = new Map();
  }

  @action
  distributeFetchResponse(data: any) {
    Object.keys(data).forEach((key) => {
      const objId = key.slice(1); // Slice off the first char since that's just there to guaruntee it's a string
      this.get(objId).getManager().setProps(data[key]);
    });
  }

  async fetchProps() {
    const options: IQueryBuilderOptions[] = [];
    this.propsToBeFetched.forEach((props, id) => {
      const variables: any = {};
      variables[`id${id}`] = {
        name: this.idName,
        type: this.idType,
        value: id,
      };
      options.push({
        operation: `o${id}: ${this.queryName}`, // Alias the queries so that we can do multiple of the same at once
        fields: props,
        variables,
      });
    });
    const query = gql.query(options);
    const output = await this.dataLoader.runQuery(query.query, query.variables);
    this.distributeFetchResponse(output.data);
  }
}
