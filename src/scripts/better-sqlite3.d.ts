declare module 'better-sqlite3' {
  interface Database {
    pragma(sql: string, ...params: any[]): Database;
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }
  interface Statement {
    get(...params: any[]): any;
    all(...params: any[]): any[];
    run(...params: any[]): { changes: number; lastInsertRowid: number };
  }
  interface DatabaseConstructor {
    new (path: string, options?: any): Database;
  }
  const Database: DatabaseConstructor;
  namespace Database {}
  export default Database;
}
