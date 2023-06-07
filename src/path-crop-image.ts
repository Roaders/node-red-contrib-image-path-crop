import { NodeAPI, Node, NodeMessage } from 'node-red';
import { loadImageBuffer } from './helpers';
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';

type Point = { x: number; y: number };

type Corners = [Point, Point, Point, ...Point[]];

interface IPerspectiveTransform {
    image?: Buffer;
    imagePath?: string;
    outputPath?: string;
    cropPath?: Corners;
}

interface IPerspectiveTransformNode extends IPerspectiveTransform, Node {
    name: string;
}

export default function (RED: NodeAPI) {
    function transformImage(this: Node, config: IPerspectiveTransformNode) {
        RED.nodes.createNode(this, config);

        this.on('input', async (msg: NodeMessage) => {
            const payload = (msg.payload as IPerspectiveTransform) ?? {};

            const cropPath = payload.cropPath;

            if (isCorners(cropPath)) {
                let buffer: Buffer;

                if (hasImageBuffer(payload)) {
                    buffer = payload.image;
                } else {
                    let fileName: string;

                    try {
                        ({ buffer, fileName } = await loadImageBuffer(payload.imagePath, config.imagePath));
                    } catch (err: unknown) {
                        this.status({ fill: 'red', text: (err as Error).message });
                        return;
                    }

                    this.status({ fill: 'green', text: `Loaded ${fileName}` });

                    msg.payload = { image: buffer };
                    this.send(msg);
                }

                const image = await loadImage(buffer);

                // Create a canvas with the desired rectangular dimensions
                const canvas = createCanvas(image.width, image.height);
                const ctx = canvas.getContext('2d');

                const firstPoint = cropPath.shift() as Point;

                ctx.beginPath();
                ctx.moveTo(firstPoint.x, firstPoint.y);
                cropPath.forEach((point) => ctx.lineTo(point.x, point.y));
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(image, 0, 0);

                const { width, height, left, top } = getDimensions(cropPath);

                const cropCanvas = createCanvas(width, height);
                const cropCtx = cropCanvas.getContext('2d');

                cropCtx.drawImage(canvas, left, top, width, height, 0, 0, width, height);

                const croppedBuffer = cropCanvas.toBuffer('image/jpeg');

                const outputPath: string | undefined = payload.outputPath ?? config.outputPath;

                if (typeof outputPath === 'string') {
                    writeFileSync(outputPath, croppedBuffer);

                    this.status({ fill: 'green', text: `Image Saved to ${outputPath}` });
                }

                msg.payload = { image: buffer };

                this.send(msg);
            } else if (payload.cropPath != null) {
                this.status({ fill: 'red', text: `cropPath in incorrect format. Unable to perform transform` });

                return;
            } else {
                this.status({ fill: 'red', text: `cropPath not defined. Unable to perform transform` });

                return;
            }
        });
    }

    RED.nodes.registerType('path-crop', transformImage);
}

function getDimensions(points: Corners): {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
} {
    const left = points.reduce((min, current) => Math.min(min, current.x), Number.POSITIVE_INFINITY);
    const right = points.reduce((min, current) => Math.max(min, current.x), 0);
    const top = points.reduce((min, current) => Math.min(min, current.y), Number.POSITIVE_INFINITY);
    const bottom = points.reduce((min, current) => Math.max(min, current.y), 0);

    const width = right - left;
    const height = bottom - top;

    return { top, left, right, bottom, width, height };
}

function hasImageBuffer<T = unknown>(value: T): value is Required<Pick<IPerspectiveTransform, 'image'>> & T {
    const message = value as IPerspectiveTransform;

    return message != null && message.image instanceof Buffer;
}

function isCorners(value: unknown): value is Corners {
    const corners = value as Corners;
    return Array.isArray(corners) && corners.every(isPoint) && corners.length >= 3;
}

function isPoint(value: unknown): value is Point {
    const point = value as Point;
    return (
        point != null &&
        typeof point.x === 'number' &&
        typeof point.y === 'number' &&
        !isNaN(point.x) &&
        !isNaN(point.y)
    );
}
