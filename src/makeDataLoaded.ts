import { makeObservable, onBecomeObserved } from "mobx";
import {
  DataLoadedPropTypes,
  getDataLoadedType,
  getIdName,
} from "./annotations";
import { DataLoadedListEntry } from "./types/DataLoadedListEntry";
import { DataLoadedObject } from "./types/DataLoadedObject";
import { NestedObject } from "./types/NestedObject";

export function makeDataLoaded<
  T extends DataLoadedListEntry | DataLoadedObject | NestedObject
>(object: T) {
  makeObservable(object);
  Object.keys(object).forEach((key) => {
    // Iterate through the keys
    const dataLoadedType = getDataLoadedType(object, key);
    const idName = getIdName(object, key);
    if (dataLoadedType && idName) {
      if (dataLoadedType === DataLoadedPropTypes.OBJECT) {
        // This is referencing a DataLoadedObject, grab the __typename
        onBecomeObserved(object, key, () => {
          object.addPropToBeFetched(`${key}.__typename`);
        });
      } else if (
        dataLoadedType === DataLoadedPropTypes.NESTED ||
        dataLoadedType === DataLoadedPropTypes.IGNORE
      ) {
        // If this object is a nested object or an ignored object, then we can ignore it as it will handle it's adding
      } else {
        // This is referencing a DataLoadedListEntry or array of them, grab the __typename and id
        onBecomeObserved(object, key, () => {
          object.addPropToBeFetched(`${key}.__typename`);
          object.addPropToBeFetched(`${key}.${idName}`);
        });
      }
    } else {
      onBecomeObserved(object, key, () => {
        object.addPropToBeFetched(key);
      });
    }
  });
}
