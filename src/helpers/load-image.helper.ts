import { basename, resolve } from 'path';
import { promises } from 'fs';

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
