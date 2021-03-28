import { MobQLIgnore } from "../annotations";
import { DataLoadedListEntryManager } from "./DataLoadedListEntryManager";

/**
 * A DataLoadedListEntry is similar to a DataLoadedObject, but has an id associated with it,
 * this allows multiple instances of this object type to exist in a collection
 */
export abstract class DataLoadedListEntry {
  @MobQLIgnore()
  private mobxManager: DataLoadedListEntryManager<any>;

  constructor(manager: DataLoadedListEntryManager<any>) {
    this.mobxManager = manager;
  }

  get isLoadingProps() {
    return this.mobxManager.isLoadingProps;
  }

  addPropsToBeFetched(props: string[]) {
    this.mobxManager.addPropsToBeFetched(props);
  }

  addPropToBeFetched(prop: string) {
    this.mobxManager.addPropToBeFetched(prop);
  }

  getManager() {
    return this.mobxManager;
  }

  abstract getId(): string;

  setProps(props: any) {
    Object.assign(this, props);
  }
}
