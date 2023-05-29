import * as cv from 'opencv4nodejs';
import { NodeAPI, Node, NodeDef, NodeMessage } from 'node-red';

export default function (RED: NodeAPI) {
    function loadImage(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);

        this.on('input', (msg: NodeMessage) => {
            msg.payload = typeof msg.payload === 'string' ? msg.payload.toLowerCase() : msg.payload;
            this.send(msg);
        });
    }

    RED.nodes.registerType('load-image', loadImage);
}

console.log(`Loading image`);

const rawImage = cv.imread('/mnt/snapshots/Litecast/3acd7b6987c8c536cc71203745cfaac7/1685026311-camera_sound.jpg');

console.log(`Encoding image`);

const buffer = cv.imencode('.jpg', rawImage);

const inputImage = cv.imdecode(buffer);

console.log(`Image:`, { inputImage });

const bedOne = {
    topLeft: new cv.Point2(709, 200),
    topRight: new cv.Point2(734, 200),
    bottomLeft: new cv.Point2(435, 738),
    bottomRight: new cv.Point2(521, 740),
};

const bedTwo = {
    topLeft: new cv.Point2(774, 185),
    topRight: new cv.Point2(801, 183),
    bottomLeft: new cv.Point2(666, 730),
    bottomRight: new cv.Point2(780, 721),
};

const bedThree = {
    topLeft: new cv.Point2(837, 178),
    topRight: new cv.Point2(860, 169),
    bottomLeft: new cv.Point2(920, 700),
    bottomRight: new cv.Point2(1045, 700),
};

const bedFour = {
    topLeft: new cv.Point2(903, 173),
    topRight: new cv.Point2(933, 169),
    bottomLeft: new cv.Point2(1176, 658),
    bottomRight: new cv.Point2(1277, 636),
};

const beds = { bedOne, bedTwo, bedThree, bedFour };

function generateImage(name: keyof typeof beds) {
    console.log(`Processing bed ${name}`);
    const { topLeft, topRight, bottomLeft, bottomRight } = beds[name];

    const top = Math.min(topLeft.y, topRight.y);
    const bottom = Math.max(bottomLeft.y, bottomRight.y);

    const sourceCorners = [topLeft, topRight, bottomLeft, bottomRight];

    const correctedWidth = bottomRight.x - bottomLeft.x;
    const correctedHeight = bottom - top;

    // Define the destination corners for perspective correction
    const dstCorners = [
        new cv.Point2(0, 0),
        new cv.Point2(correctedWidth, 0),
        new cv.Point2(0, correctedHeight),
        new cv.Point2(correctedWidth, correctedHeight),
    ];

    //console.log(`destination: `, {sourceCorners, dstCorners})

    // Create the perspective transform matrix
    const matrix = cv.getPerspectiveTransform(sourceCorners, dstCorners);

    // Apply perspective correction
    const correctedImage = inputImage.warpPerspective(matrix, new cv.Size(correctedWidth, correctedHeight));

    // Save the corrected image
    cv.imwrite(`/mnt/snapshots/output/output_${name}.jpg`, correctedImage);
    console.log(`Perspective correction complete! (${name})`);
}

//Object.keys(beds).forEach((key) => generateImage(key as keyof typeof beds));
