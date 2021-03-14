import { makeObservable, onBecomeObserved } from "mobx";
import { DataLoadedListEntry } from "./DataLoadedListEntry";

const excludedProps = [
  "propsToBeFetched",
  "propsAlreadyFetched",
  "propsBeingFetched",
  "queryName",
  "id",
  "dataLoader",
  "loadingProps",
  "list",
  "isNull",
]; // These are the props that are used internally by DataLoadedObjects (plus the id)

export function makeDataLoaded(object: DataLoadedListEntry) {
  makeObservable(object);
  Object.keys(object).forEach((key) => {
    if (!excludedProps.includes(key)) {
      onBecomeObserved(object, key, () => {
        object.addPropToBeFetched(key);
      });
    }
  });
}
