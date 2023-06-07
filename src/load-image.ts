import { NodeAPI, Node, NodeMessage } from 'node-red';
import { loadImageBuffer } from './helpers';

interface ILoadImageNode extends Node {
    name: string;
    path?: string;
    pathType?: string;
}

export default function (RED: NodeAPI) {
    function loadImage(this: Node, config: ILoadImageNode) {
        RED.nodes.createNode(this, config);

        this.on('input', async (msg: NodeMessage) => {
            let filePath: string;
            try {
                filePath = await getPropertyValue<string>(RED, this, config.path, config.pathType, msg);
            } catch (e) {
                this.status({ fill: 'red', text: 'Unable to load image. path and pathType must be defined' });
                return;
            }

            let buffer: Buffer;
            let fileName: string;

            try {
                ({ buffer, fileName } = await loadImageBuffer(filePath));
            } catch (err: unknown) {
                this.status({ fill: 'red', text: (err as Error).message });
                return;
            }

            this.status({ fill: 'green', text: `Loaded ${fileName}` });

            msg.payload = { image: buffer };
            this.send(msg);
        });
    }

    RED.nodes.registerType('load-image', loadImage);
}

function getPropertyValue<T>(
    RED: NodeAPI,
    node: Node,
    value: string | undefined,
    type: string | undefined,
    msg: NodeMessage
): Promise<T> {
    return new Promise((resolve, reject) => {
        if (value == null || value === '' || type == null || type === '') {
            reject(new Error(`value and type must be defined`));
            return;
        }

        RED.util.evaluateNodeProperty(value, type, node, msg, (err, result) => {
            if (err != null) {
                reject(err);
                return;
            }

            resolve(result);
        });
    });
}
