import { basename, resolve } from 'path';
import { promises } from 'fs';
import { NodeAPI, NodeMessage, Node } from 'node-red';

export async function loadImageBuffer(
    ...paths: [string | undefined, ...(string | undefined)[]]
): Promise<{ buffer: Buffer; sourcePath: string; fileName: string }> {
    let sourcePath = paths.find((currentPath) => currentPath != null && typeof currentPath === 'string');

    if (sourcePath == null) {
        throw new Error('No image path defined could not load image');
    }

    sourcePath = resolve(sourcePath);

    const buffer = await promises.readFile(sourcePath);

    const fileName = basename(sourcePath);

    return { buffer, sourcePath, fileName };
}

export function getPropertyValue<T>(
    RED: NodeAPI,
    node: Node,
    value: string | undefined,
    type: string | undefined,
    msg: NodeMessage
): Promise<T | undefined> {
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
