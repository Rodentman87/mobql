import "reflect-metadata";

const dataLoadedMetadataKey = Symbol("dataLoaded");

export enum DataLoadedPropTypes {
  SCALAR,
  OBJECT,
  LIST_OBJECT,
  ARRAY_LIST_OBJECT,
  NESTED,
  IGNORE,
}

export function MobQLScalar() {
  return Reflect.metadata(dataLoadedMetadataKey, {
    type: DataLoadedPropTypes.SCALAR,
  });
}

export function MobQLObject() {
  return Reflect.metadata(dataLoadedMetadataKey, {
    type: DataLoadedPropTypes.OBJECT,
  });
}

export function MobQLListObject(typeName: string) {
  return Reflect.metadata(dataLoadedMetadataKey, {
    type: DataLoadedPropTypes.LIST_OBJECT,
    typeName,
  });
}

export function MobQLArrayListObject(typeName: string) {
  return Reflect.metadata(dataLoadedMetadataKey, {
    type: DataLoadedPropTypes.ARRAY_LIST_OBJECT,
    typeName,
  });
}

export function MobQLNested() {
  return Reflect.metadata(dataLoadedMetadataKey, {
    type: DataLoadedPropTypes.NESTED,
  });
}

export function MobQLIgnore() {
  return Reflect.metadata(dataLoadedMetadataKey, {
    type: DataLoadedPropTypes.IGNORE,
  });
}

export function getDataLoadedType(target: any, propertyKey: string) {
  const value = Reflect.getMetadata(dataLoadedMetadataKey, target, propertyKey);
  return value ? value.type : undefined;
}

export function getDataLoadedTypeName(target: any, propertyKey: string) {
  const value = Reflect.getMetadata(dataLoadedMetadataKey, target, propertyKey);
  return value ? value.typeName : undefined;
}
