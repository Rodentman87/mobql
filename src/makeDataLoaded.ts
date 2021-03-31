import { makeObservable, observable, onBecomeObserved } from "mobx";
import { DataLoadedPropTypes, getDataLoadedType } from "./annotations";
import { DataLoadedListEntry } from "./dataloaders/DataLoadedListEntry";
import { DataLoadedObject } from "./dataloaders/DataLoadedObject";
import { NestedObject } from "./dataloaders/NestedObject";

export function makeDataLoaded<
  T extends DataLoadedListEntry | DataLoadedObject | NestedObject
>(object: T) {
  const annotations: any = {};
  Object.keys(object).forEach((key) => {
    if (getDataLoadedType(object, key) === DataLoadedPropTypes.IGNORE) return;
    annotations[key] = observable;
  });
  makeObservable(object, annotations);
  Object.keys(object).forEach((key) => {
    if (getDataLoadedType(object, key) === DataLoadedPropTypes.IGNORE) return;
    if (getDataLoadedType(object, key) === DataLoadedPropTypes.NESTED)
      makeDataLoaded(object[key as keyof T] as any);
    onBecomeObserved(object, key, () => {
      object.addPropToBeFetched(key);
    });
  });
}
