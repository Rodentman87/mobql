export abstract class DataLoader {
  abstract runQuery(query: string, variables: any): Promise<any>;
}
