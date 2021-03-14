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

/**
 * A DataLoadedObject is a reference to an object in your GraphQL schema
 * this allows MobQL to automatically query the API for props when they're used
 * for the first time
 */
export abstract class DataLoadedObject {
  @observable private propsToBeFetched: string[] = [];
  @observable private propsBeingFetched: string[] = [];
  private dataLoader: DataLoader;
  private propsAlreadyFetched: string[] = [];
  private queryName: string;

  constructor(queryName: string, dataLoader: DataLoader) {
    this.queryName = queryName;
    this.dataLoader = dataLoader;
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
    this.markPropsAsFetched(Object.keys(props));
    Object.assign(this, props);
  }
}
