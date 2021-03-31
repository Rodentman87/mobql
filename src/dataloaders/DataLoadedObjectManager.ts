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
import {
  DataLoadedPropTypes,
  getDataLoadedType,
  getDataLoadedTypeName,
  MobQLIgnore,
} from "../annotations";
import { DataLoadedObject } from "./DataLoadedObject";
import { DataLoadedList } from "./DataLoadedList";
import { NestedObject } from "./NestedObject";
import { makeDataLoaded } from "../makeDataLoaded";

/**
 * A DataLoadedObject is a reference to an object in your GraphQL schema
 * this allows MobQL to automatically query the API for props when they're used
 * for the first time
 */
export class DataLoadedObjectManager<T extends DataLoadedObject> {
  @MobQLIgnore()
  @observable
  private propsToBeFetched: (keyof T)[] = [];
  @MobQLIgnore()
  @observable
  private propsBeingFetched: (keyof T)[] = [];
  @MobQLIgnore() private dataLoader: DataLoader;
  @MobQLIgnore()
  private propsAlreadyFetched: (keyof T)[] = [];
  @MobQLIgnore() private queryName: string;
  @MobQLIgnore() private objectManager: ObjectManager;
  private managedObject: T;

  constructor(
    queryName: string,
    dataLoader: DataLoader,
    objectManager: ObjectManager,
    child: new (manager: DataLoadedObjectManager<any>) => T
  ) {
    this.queryName = queryName;
    this.dataLoader = dataLoader;
    this.objectManager = objectManager;
    this.managedObject = new child(this);
    makeDataLoaded(this.managedObject);
    makeObservable(this);
    // Create the observer that fetches the data whenever new props need to be loaded
    autorun(() => {
      if (this.propsToBeFetched.length < 1) return; // Only fetch props if there's actually props to be fetched
      this.fetchProps();
      this.markPropsBeingFetched(this.propsToBeFetched);
    });
  }

  getChild() {
    return this.managedObject;
  }

  @computed
  get isLoadingProps() {
    return this.propsBeingFetched.length > 1;
  }

  @action
  async fetchProps() {
    // First we need to map some of our props because objects need to be represented differently for gql-query-builder
    let fetching: any[] = [];
    this.propsToBeFetched.forEach((prop) => {
      const propType = getDataLoadedType(this.managedObject, prop as string);
      switch (propType) {
        case DataLoadedPropTypes.SCALAR:
          fetching.push(prop);
          break;
        case DataLoadedPropTypes.OBJECT:
          fetching.push(`${prop}.__typename`);
          break;
        case DataLoadedPropTypes.LIST_OBJECT:
        case DataLoadedPropTypes.ARRAY_LIST_OBJECT:
          const temp: any = {};
          temp[prop] = [
            "__typename",
            this.objectManager.getIdFromType(
              getDataLoadedTypeName(this.managedObject, prop as string)
            ),
          ];
          fetching.push(temp);
          break;
        default:
          if (propType !== DataLoadedPropTypes.IGNORE) fetching.push(prop);
          break;
      }
    });
    const query = gql.query({
      operation: this.queryName,
      fields: fetching,
    });
    const output = await this.dataLoader.runQuery(query.query, query.variables);
    runInAction(() => {
      this.setProps(output.data[this.queryName]);
    });
  }

  @action
  addPropsToBeFetched(props: (keyof T)[]) {
    props.forEach(this.addPropToBeFetched);
  }

  @action
  addPropToBeFetched(prop: keyof T) {
    if (this.propsAlreadyFetched.includes(prop)) return;
    this.propsToBeFetched.push(prop);
    this.propsAlreadyFetched.push(prop);
  }

  @action
  clearPropsToBeFetched() {
    this.propsToBeFetched = [];
  }

  @action
  markPropsBeingFetched(props: (keyof T)[]) {
    this.propsToBeFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsBeingFetched.push(...props);
  }

  @action
  markPropsAsFetched(props: (keyof T)[]) {
    this.propsBeingFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsAlreadyFetched.push(...props);
  }

  @action
  setProps(props: any) {
    if (props !== null && props !== undefined) {
      let assignedProps: any = {};
      Object.keys(props).forEach((prop) => {
        const propType = getDataLoadedType(this.managedObject, prop as string);
        switch (propType) {
          case DataLoadedPropTypes.SCALAR:
            assignedProps[prop] = props[prop];
            break;
          case DataLoadedPropTypes.OBJECT:
            assignedProps[prop] = this.objectManager.getFromTypename(
              props[prop].__typename
            );
            break;
          case DataLoadedPropTypes.LIST_OBJECT:
            const list = this.objectManager.getFromTypename(
              props[prop].__typename
            ) as DataLoadedList<any>;
            assignedProps[prop] = list.get(
              props[prop][
                this.objectManager.getIdFromType(
                  getDataLoadedTypeName(this.managedObject, prop as string)
                )
              ]
            );
            break;
          case DataLoadedPropTypes.ARRAY_LIST_OBJECT:
            const lista = this.objectManager.getFromTypename(
              props[prop][0].__typename
            ) as DataLoadedList<any>;
            assignedProps[prop] = props[prop].map((o: any) =>
              lista.get(
                o[
                  this.objectManager.getIdFromType(
                    getDataLoadedTypeName(this.managedObject, prop as string)
                  )
                ]
              )
            );
            break;
          case DataLoadedPropTypes.NESTED:
            ((this.managedObject[
              prop as keyof T
            ] as unknown) as NestedObject).setProps(props[prop]);
            break;
          default:
            assignedProps[prop] = props[prop];
            break;
        }
      });
      this.managedObject.setProps(assignedProps);
      this.markPropsAsFetched(Object.keys(assignedProps) as (keyof T)[]);
    }
  }
}
