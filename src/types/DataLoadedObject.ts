import {
  action,
  autorun,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import * as gql from "gql-query-builder";
import { DataLoader } from "./DataLoader";
import { ObjectManager } from "./ObjectManager";
import { DataLoadedList } from "./DataLoadedList";
import {
  dataLoaded,
  DataLoadedPropTypes,
  getDataLoadedType,
  getIdName,
} from "../annotations";

/**
 * A DataLoadedObject is a reference to an object in your GraphQL schema
 * this allows MobQL to automatically query the API for props when they're used
 * for the first time
 */
export abstract class DataLoadedObject {
  @dataLoaded(DataLoadedPropTypes.IGNORE)
  @observable
  private propsToBeFetched: string[] = [];
  @dataLoaded(DataLoadedPropTypes.IGNORE)
  @observable
  private propsBeingFetched: string[] = [];
  @dataLoaded(DataLoadedPropTypes.IGNORE) private dataLoader: DataLoader;
  @dataLoaded(DataLoadedPropTypes.IGNORE)
  private propsAlreadyFetched: string[] = [];
  @dataLoaded(DataLoadedPropTypes.IGNORE) private queryName: string;
  @dataLoaded(DataLoadedPropTypes.IGNORE) private objectManager: ObjectManager;

  constructor(
    queryName: string,
    dataLoader: DataLoader,
    objectManager: ObjectManager
  ) {
    this.queryName = queryName;
    this.dataLoader = dataLoader;
    this.objectManager = objectManager;
    makeObservable(this);
    // Create the observer that fetches the data whenever new props need to be loaded
    autorun(() => {
      if (this.propsToBeFetched.length < 1) return; // Only fetch props if there's actually props to be fetched
      this.fetchProps();
      this.markPropsBeingFetched(this.propsToBeFetched);
    });
  }

  @computed
  get loadingProps() {
    return this.propsBeingFetched.length > 1;
  }

  @action
  async fetchProps() {
    const query = gql.query({
      operation: this.queryName,
      fields: this.propsToBeFetched,
    });
    const output = await this.dataLoader.runQuery(query.query, query.variables);
    runInAction(() => {
      this.setProps(output.data[this.queryName]);
    });
  }

  @action
  clearPropsToBeFetched() {
    this.propsToBeFetched = [];
  }

  @action
  markPropsBeingFetched(props: string[]) {
    this.propsToBeFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsBeingFetched.push(...props);
  }

  @action
  markPropsAsFetched(props: string[]) {
    this.propsBeingFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsAlreadyFetched.push(...props);
  }

  @action
  addPropToBeFetched(prop: string) {
    if (this.propsAlreadyFetched.includes(prop)) return;
    this.propsToBeFetched.push(prop);
    this.propsAlreadyFetched.push(prop);
  }

  @action
  setProps(props: any) {
    const fetched: string[] = [];
    const modifiedProps: any = {};
    Object.keys(props).forEach((key) => {
      const dataType = getDataLoadedType(this, key);
      const value = props[key];
      if (dataType === DataLoadedPropTypes.ARRAY_LIST_OBJECT) {
        // We have an array, this means we need to map it to an array of referenced objects
        if (value.length > 0) {
          const first = value[0];
          if (!first.__typename)
            throw new Error(
              `A __typename was not returned for array with key ${key}`
            );
          const list = this.objectManager.getFromTypename(first.__typename);
          if (!(list instanceof DataLoadedList))
            throw new Error(
              `No list was registered for __typename ${first.__typename}`
            );
          const idName = this.objectManager.getIdFromTypename(first.__typename);
          fetched.push(`${key}.${idName}`);
          modifiedProps[key] = value.map((v: any) => list.get(v[idName]));
        } else {
          modifiedProps[key] = [];
          const idName = getIdName(this, key);
          fetched.push(`${key}.${idName}`);
        }
        fetched.push(`${key}.__typename`);
      } else if (value instanceof Object) {
        // We have an object, we need to check if it's a referenced object or just a normal object
        if (value.__typename) {
          // This is a referenced prop, get the object list and return it
          const objOrList = this.objectManager.getFromTypename(
            value.__typename
          );
          if (objOrList instanceof DataLoadedObject) {
            modifiedProps[key] = objOrList;
          } else {
            const idName = this.objectManager.getIdFromTypename(
              value.__typename
            );
            modifiedProps[key] = objOrList.get(value[idName]);
            fetched.push(`${key}.${idName}`);
          }
          fetched.push(`${key}.__typename`);
        } else {
          if (dataType === DataLoadedPropTypes.NESTED) {
            // @ts-expect-error
            fetched.push(...(this[key] as NestedObject).setProps(value));
          } else {
            // This is just a normal object
            modifiedProps[key] = value;
            fetched.push(...Object.keys(value).map((k) => `${key}.${k}`));
          }
        }
      } else {
        // We have a primitive, go ahead and just add it
        modifiedProps[key] = value;
        fetched.push(key);
      }
    });
    this.markPropsAsFetched(fetched);
    Object.assign(this, modifiedProps);
  }
}
