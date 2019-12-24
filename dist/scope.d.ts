export declare type TKind = 'var' | 'const' | 'let';
export declare type TStoreKey = 'varStore' | 'letStore' | 'constStore';
interface IStore extends Object {
    [index: string]: any;
}
export declare class Scope {
    parentScope?: Scope | undefined;
    varStore: IStore;
    letStore: IStore;
    constStore: IStore;
    constructor(parentScope?: Scope | undefined);
    create(kind: TKind, key: string, value?: any): void;
    query(key: string): any;
    update(key: string, value: any): void;
    delete(key: string): boolean;
    private findVariable;
}
export {};
