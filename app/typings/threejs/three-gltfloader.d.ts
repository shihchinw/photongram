/// <reference path="./three.d.ts" />

declare module THREE {
    export class glTFLoader {
        constructor(manager?: LoadingManager);

        load(url: string, onLoad: (obj) => void);
    }
}