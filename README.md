# node-red-contrib-image-path-crop

Crops an image to an irregular path:

![alt text](https://raw.githubusercontent.com/Roaders/node-red-contrib-image-path-crop/main/assets/linear-perspective-walking-railroad_small.jpg)

becomes

![alt text](https://raw.githubusercontent.com/Roaders/node-red-contrib-image-path-crop/main/assets/output_small.jpg)

## Nodes

### Load Image

Loads a given path and outputs it as a `Buffer`. `Buffer` can be an input to `path-crop-image` node and is useful if you want to load an image once but crop it many times.

#### Inputs

* **path** - the path to the image

### Path Crop Image

Crops an image to an irregular shaped path.

#### Inputs

* **image** - can be specified as a path to an image which will be loaded or can be specified as a `Buffer` that has already been loaded. To specify the output of the `load-image` node the node edit dialog should be set to `msg.payload` so that the `Buffer` in the message payload from the previous node can be used.

* **cropPath** - An array of points that form the path to be cropped. At least 3 points must be specified. Example:

```
            [
                {
                    "x": 530,
                    "y": 460
                },
                {
                    "x": 215,
                    "y": 800
                },
                {
                    "x": 933,
                    "y": 800
                }
            ]
```

* **outputPath** - Optional. If set the modified image will be saved to this path.

Inputs for both nodes can be directly specified in the node edit dialog or they can be specified in a message property or in the flow or global context.