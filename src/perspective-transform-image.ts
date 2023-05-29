import * as cv from 'opencv4nodejs';
import { NodeAPI, Node, NodeMessage } from 'node-red';

interface IPerspectiveTransformNode extends Node {
    name: string;
    path?: string;
}

export default function (RED: NodeAPI) {
    function transformImage(this: Node, config: IPerspectiveTransformNode) {
        RED.nodes.createNode(this, config);

        this.on('input', (msg: NodeMessage) => {
            let image: cv.Mat;

            if (msg.payload instanceof Buffer) {
                image = cv.imdecode(msg.payload);
            } else {
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

                image = cv.imread(path);
            }

            msg.payload = { width: image.rows, height: image.cols };

            this.send(msg);
        });
    }

    RED.nodes.registerType('persective-transform', transformImage);
}
