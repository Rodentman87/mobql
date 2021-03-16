import { action, autorun, computed, makeObservable, observable } from "mobx";
import {
  dataLoaded,
  DataLoadedPropTypes,
  getDataLoadedType,
  getIdName,
} from "../annotations";
import { DataLoadedList } from "./DataLoadedList";
import { DataLoadedObject } from "./DataLoadedObject";
import { NestedObject } from "./NestedObject";
import { ObjectManager } from "./ObjectManager";

/**
 * A DataLoadedListEntry is similar to a DataLoadedObject, but has an id associated with it,
 * this allows multiple instances of this object type to exist in a collection
 */
export abstract class DataLoadedListEntry {
  @dataLoaded(DataLoadedPropTypes.IGNORE)
  @observable
  private propsToBeFetched: string[] = [];
  @dataLoaded(DataLoadedPropTypes.IGNORE)
  @observable
  private propsBeingFetched: string[] = [];
  @dataLoaded(DataLoadedPropTypes.IGNORE) @observable isNull: boolean = false;
  @dataLoaded(DataLoadedPropTypes.IGNORE) id: string;
  @dataLoaded(DataLoadedPropTypes.IGNORE) private idName: string;
  @dataLoaded(DataLoadedPropTypes.IGNORE) private idType: string;
  @dataLoaded(DataLoadedPropTypes.IGNORE) private list: DataLoadedList<any>;
  @dataLoaded(DataLoadedPropTypes.IGNORE)
  private propsAlreadyFetched: string[] = [];
  @dataLoaded(DataLoadedPropTypes.IGNORE) private objectManager: ObjectManager;

  constructor(
    id: string,
    list: DataLoadedList<any>,
    objectManager: ObjectManager,
    idName: string = "id",
    idType: string = "ID!"
  ) {
    this.id = id;
    this.list = list;
    this.objectManager = objectManager;
    this.idType = idType;
    this.idName = idName;
    makeObservable(this);
    // Create the observer that fetches the data whenever new props need to be loaded
    autorun(() => {
      if (this.propsToBeFetched.length < 1) return; // Only fetch props if there's actually props to be fetched
      this.fetchProps();
      this.markPropsBeingFetched(this.propsToBeFetched);
    });
  }

  @computed
  get isLoadingProps() {
    return this.propsBeingFetched.length > 1;
  }

  @action
  private async fetchProps() {
    // First we need to map some of our props because objects need to be represented differently for gql-query-builder
    let fetching: any[] = [];
    this.propsToBeFetched.forEach((prop) => {
      if (prop.includes(".")) {
        const [first, second] = prop.split(".");
        let indexOfObject = 0;
        const object = fetching.find((o, index) => {
          if (o instanceof Object) {
            if (Object.keys(o).includes(first)) {
              indexOfObject = index;
              return true;
            }
          }
          return false;
        });
        if (object) {
          object[first].push(second);
          fetching[indexOfObject] = object;
        } else {
          const newObject: any = {};
          newObject[first] = [second];
          fetching.push(newObject);
        }
      } else {
        fetching.push(prop);
      }
    });
    this.list.addPropsToBeFetched(this.id, fetching, this.idName, this.idType);
  }

  @action
  private markPropsBeingFetched(props: string[]) {
    this.propsToBeFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsBeingFetched.push(...props);
  }

  @action
  private markPropsAsFetched(props: string[]) {
    this.propsBeingFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsAlreadyFetched.push(...props);
  }

  @action
  addPropsToBeFetched(props: string[]) {
    props.forEach(this.addPropToBeFetched);
  }

  @action
  addPropToBeFetched(prop: string) {
    if (this.propsAlreadyFetched.includes(prop)) return;
    this.propsToBeFetched.push(prop);
    this.propsAlreadyFetched.push(prop);
  }

  @action
  setProps(props: any) {
    if (props !== null) {
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
            const idName = this.objectManager.getIdFromTypename(
              first.__typename
            );
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
    } else {
      this.isNull = true;
      this.propsBeingFetched = [];
    }
  }
}
