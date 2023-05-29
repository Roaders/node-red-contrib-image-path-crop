import * as cv from 'opencv4nodejs';
import { NodeAPI, Node, NodeMessage } from 'node-red';
import { basename, resolve } from 'path';

interface ILoadImageNode extends Node {
    name: string;
    path?: string;
}

export default function (RED: NodeAPI) {
    function loadImage(this: Node, config: ILoadImageNode) {
        RED.nodes.createNode(this, config);

        console.log(`CREATING NODE (${typeof config.path}): ${config.path}`, config.path);

        this.on('input', (msg: NodeMessage) => {
            let path: string | undefined;

            if (typeof msg.payload === 'string') {
                path = msg.payload;
            } else if (typeof config.path === 'string') {
                path = config.path;
            }

            if (path == null) {
                this.status({ fill: 'red', text: 'No image path defined could not load image' });
                return;
            }

            path = resolve(path);

            const fileName = basename(path);

            this.status({ fill: 'blue', text: `Loading ${fileName}...` });

            const rawImage = cv.imread(path);

            const buffer = cv.imencode('.jpg', rawImage);

            this.status({ fill: 'green', text: `Loaded ${fileName}` });

            msg.payload = buffer;
            this.send(msg);
        });
    }

    RED.nodes.registerType('load-image', loadImage);
}
