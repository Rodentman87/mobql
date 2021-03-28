import { DataLoadedObjectManager } from "./DataLoadedObjectManager";

/**
 * A DataLoadedObject is a reference to an object in your GraphQL schema
 * this allows MobQL to automatically query the API for props when they're used
 * for the first time
 */
export abstract class DataLoadedObject {
  mobqlManager: DataLoadedObjectManager<any>;

  constructor(mobqlManager: DataLoadedObjectManager<any>) {
    this.mobqlManager = mobqlManager;
  }

  get isLoadingProps() {
    return this.mobqlManager.isLoadingProps;
  }

  addPropsToBeFetched(props: string[]) {
    this.mobqlManager.addPropsToBeFetched(props);
  }

  addPropToBeFetched(prop: string) {
    this.mobqlManager.addPropToBeFetched(prop);
  }

  getManager() {
    return this.mobqlManager;
  }

  setProps(props: any) {
    Object.assign(this, props);
  }
}
