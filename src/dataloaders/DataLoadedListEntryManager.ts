import { action, autorun, computed, makeObservable, observable } from "mobx";
import {
  DataLoadedPropTypes,
  getDataLoadedType,
  getDataLoadedTypeName,
} from "../annotations";
import { DataLoadedList } from "./DataLoadedList";
import { DataLoadedListEntry } from "./DataLoadedListEntry";
import { NestedObject } from "./NestedObject";
import { ObjectManager } from "./ObjectManager";

/**
 * A DataLoadedListEntry is similar to a DataLoadedObject, but has an id associated with it,
 * this allows multiple instances of this object type to exist in a collection
 */
export class DataLoadedListEntryManager<T extends DataLoadedListEntry> {
  @observable
  private propsToBeFetched: (keyof T)[] = [];
  @observable
  private propsBeingFetched: (keyof T)[] = [];
  @observable isNull: boolean = false;
  private list: DataLoadedList<any>;
  private propsAlreadyFetched: (keyof T)[] = [];
  private objectManager: ObjectManager;
  private managedObject: T;

  constructor(
    id: string,
    list: DataLoadedList<any>,
    objectManager: ObjectManager,
    child: new (id: string, manager: DataLoadedListEntryManager<any>) => T
  ) {
    this.list = list;
    this.objectManager = objectManager;
    this.managedObject = new child(id, this);
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
  private async fetchProps() {
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
        case DataLoadedPropTypes.NESTED:
          const newTemp: any = {};
          newTemp[prop] = ((this.getChild()[
            prop
          ] as unknown) as NestedObject).getPropsToBeFetched();
          fetching.push(newTemp);
          break;
        default:
          if (propType !== DataLoadedPropTypes.IGNORE) fetching.push(prop);
          break;
      }
    });
    this.list.addPropsToBeFetched(this.managedObject.getId(), fetching);
  }

  @action
  private markPropsBeingFetched(props: (keyof T)[]) {
    this.propsToBeFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsBeingFetched.push(...props);
  }

  @action
  private markPropsAsFetched(props: (keyof T)[]) {
    this.propsBeingFetched = this.propsToBeFetched.filter(
      (prop) => !props.includes(prop)
    );
    this.propsAlreadyFetched.push(...props);
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
