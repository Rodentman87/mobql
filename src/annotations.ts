import "reflect-metadata";

const dataLoadedMetadataKey = Symbol("dataLoaded");

export enum DataLoadedPropTypes {
  OBJECT,
  LIST_OBJECT,
  ARRAY_LIST_OBJECT,
  NESTED,
  IGNORE,
}

export function dataLoaded(type: DataLoadedPropTypes, idName: string = "id") {
  return Reflect.metadata(dataLoadedMetadataKey, { type, idName });
}

export function getDataLoadedType(target: any, propertyKey: string) {
  const value = Reflect.getMetadata(dataLoadedMetadataKey, target, propertyKey);
  return value ? value.type : undefined;
}

export function getIdName(target: any, propertyKey: string) {
  const value = Reflect.getMetadata(dataLoadedMetadataKey, target, propertyKey);
  return value ? value.idName : undefined;
}
