import { action } from "mobx";
import {
  dataLoaded,
  DataLoadedPropTypes,
  getDataLoadedType,
} from "../annotations";

export interface NestedParent {
  addPropToBeFetched(prop: string): void;
}

export class NestedObject {
  @dataLoaded(DataLoadedPropTypes.IGNORE) private parent: NestedParent;
  @dataLoaded(DataLoadedPropTypes.IGNORE) private propName: string;

  constructor(parent: NestedParent, propName: string) {
    this.parent = parent;
    this.propName = propName;
  }

  addPropToBeFetched(prop: string) {
    this.parent.addPropToBeFetched(`${this.propName}.${prop}`);
  }

  @action
  setProps(props: any) {
    const fetched: string[] = [];
    const modifiedProps: any = {};
    Object.keys(props).forEach((key) => {
      const dataType = getDataLoadedType(this, key);
      const value = props[key];
      if (dataType && dataType !== DataLoadedPropTypes.NESTED) {
        throw new Error(
          "Nested props currently can't have other data loaded prop types as children"
        );
      } else if (dataType === DataLoadedPropTypes.NESTED) {
        // @ts-expect-error
        fetched.push(...(this[key] as NestedObject).setProps(value));
      } else {
        // We have a primitive, go ahead and just add it
        modifiedProps[key] = value;
        fetched.push(key);
      }
    });
    Object.assign(this, modifiedProps);
    return fetched;
  }
}
