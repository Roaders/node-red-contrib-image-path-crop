import * as cv from 'opencv4nodejs';
import { NodeAPI, Node, NodeMessage } from 'node-red';
import { basename } from 'path';

type Point = { x: number; y: number };

type Corners = { topLeft: Point; topRight: Point; bottomLeft: Point; bottomRight: Point };

interface IPerspectiveTransform {
    image?: Buffer;
    path?: string;
    outputPath?: string;
    sourceCorners?: Corners;
}

interface IPerspectiveTransformNode extends IPerspectiveTransform, Node {
    name: string;
}

export default function (RED: NodeAPI) {
    function transformImage(this: Node, config: IPerspectiveTransformNode) {
        RED.nodes.createNode(this, config);

        this.on('input', (msg: NodeMessage) => {
            const payload = (msg.payload as IPerspectiveTransform) ?? {};

            let image: cv.Mat;

            if (hasImageBuffer(payload)) {
                image = cv.imdecode(payload.image);
            } else {
                const path: string | undefined = payload.path ?? config.path;

                if (typeof path != 'string') {
                    this.status({ fill: 'red', text: 'No image path defined could not load image' });
                    return;
                }

                image = cv.imread(path);

                const fileName = basename(path);
                this.status({ fill: 'green', text: `Loaded ${fileName}` });
            }

            let correctedImage = image;

            if (isCorners(payload.sourceCorners)) {
                const { topLeft, bottomLeft, bottomRight, topRight } = payload.sourceCorners;

                const left = Math.min(topLeft.x, bottomLeft.x);
                const right = Math.max(topRight.x, bottomRight.x);
                const top = Math.min(topLeft.y, topRight.y);
                const bottom = Math.max(bottomLeft.y, bottomRight.y);

                const sourceCorners = [topLeft, topRight, bottomLeft, bottomRight];

                const correctedWidth = right - left;
                const correctedHeight = bottom - top;

                // Define the destination corners for perspective correction
                const dstCorners = [
                    new cv.Point2(0, 0),
                    new cv.Point2(correctedWidth, 0),
                    new cv.Point2(0, correctedHeight),
                    new cv.Point2(correctedWidth, correctedHeight),
                ];

                // Create the perspective transform matrix
                const matrix = cv.getPerspectiveTransform(
                    sourceCorners.map(({ x, y }) => new cv.Point2(x, y)),
                    dstCorners
                );

                console.log({ correctedWidth, correctedHeight, sourceCorners: payload.sourceCorners, dstCorners });

                // Apply perspective correction
                correctedImage = image.warpPerspective(matrix, new cv.Size(correctedWidth, correctedHeight));
            } else if (payload.sourceCorners != null) {
                this.status({ fill: 'red', text: `sourceCorners in incorrect format. Unable to perform transform` });

                return;
            }

            const outputPath: string | undefined = payload.outputPath ?? config.outputPath;

            if (typeof outputPath === 'string') {
                cv.imwrite(outputPath, correctedImage);

                this.status({ fill: 'green', text: `Image Saved to ${outputPath}` });
            }

            const buffer = cv.imencode('.jpg', correctedImage);
            msg.payload = { image: buffer };

            this.send(msg);
        });
    }

    RED.nodes.registerType('persective-transform', transformImage);
}

function hasImageBuffer<T = unknown>(value: T): value is Required<Pick<IPerspectiveTransform, 'image'>> & T {
    const message = value as IPerspectiveTransform;

    return message != null && message.image instanceof Buffer;
}

function isCorners(value: unknown): value is Corners {
    const corners = value as Corners;
    return (
        corners != null &&
        isPoint(corners.topLeft) &&
        isPoint(corners.topRight) &&
        isPoint(corners.bottomLeft) &&
        isPoint(corners.bottomRight)
    );
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
