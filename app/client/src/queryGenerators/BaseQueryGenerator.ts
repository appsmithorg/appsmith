export enum COMMAND_TYPES {
  "FIND" = "FIND",
  "INSERT" = "INSERT",
  "UPDATE" = "UPDATE",
}
export class BaseQueryGenerator {
  build(command: COMMAND_TYPES, tableName: string) {
    return { command: { data: command }, collection: { data: tableName } };
  }
}
