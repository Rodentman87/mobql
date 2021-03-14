import { action, autorun, computed, makeObservable, observable } from "mobx";
import { DataLoadedList } from "./DataLoadedList";

/**
 * A DataLoadedListEntry is similar to a DataLoadedObject, but has an id associated with it,
 * this allows multiple instances of this object type to exist in a collection
 */
export abstract class DataLoadedListEntry {
  @observable private propsToBeFetched: string[] = [];
  @observable private propsBeingFetched: string[] = [];
  @observable isNull: boolean = false;
  id: string;
  private list: DataLoadedList<any>;
  private propsAlreadyFetched: string[] = [];

  constructor(id: string, list: DataLoadedList<any>) {
    this.id = id;
    this.list = list;
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
    this.list.addPropsToBeFetched(this.id, this.propsToBeFetched);
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
      this.markPropsAsFetched(Object.keys(props));
      Object.assign(this, props);
    } else {
      this.isNull = true;
      this.propsBeingFetched = [];
    }
  }
}
