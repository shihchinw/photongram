/// <reference path="./three.d.ts" />

declare module THREE {
    export class OBJLoader {
        constructor(manager?: LoadingManager);

        load(url: string, onLoad: (obj:Object3D) => void, onProgress?, onError?);
        parse(text: string): Object3D;
    }
}