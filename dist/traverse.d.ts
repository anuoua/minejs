import { Scope } from './scope';
import EsTree from 'estree';
export declare type AstNode = EsTree.Node | EsTree.Statement | EsTree.Declaration | EsTree.Expression | EsTree.Pattern;
export declare const traverse: (node: EsTree.Node, scope: Scope, ...rest: any[]) => any;
