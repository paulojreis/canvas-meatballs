(function () {
    'use strict';
    var ctx,
        auxCtx,
        mainCanvas,
        auxCanvas,
        canvasWidth,
        canvasHeight,
        auxCanvasWidth,
        auxCanvasHeight,
        // Demo parameters.
        downFactor,
        maxspeed,
        nMeatballs,
        radius,
        // Demo objects.
        imageData,
        data,
        meatballs,
        queueResize,
        // Methods.
        init,
        setCanvasSizes,
        update,
        solveEq;

    init = function() {
        mainCanvas  = document.getElementById('canvas');    // The existing canvas.
        auxCanvas   = document.createElement('canvas');     // The backbuffer wannabe (smaller, offscreen canvas).
        ctx         = mainCanvas.getContext('2d');
        auxCtx      = auxCanvas.getContext('2d');

        // Demo parameters.
        downFactor  = 4;    // Downscaling factor. For performance reasons, the metaballs can't be rendered at full window size - we opt to render them at a fraction (applied to the aux canvas).
        nMeatballs  = 12;   // The number of metaballs.
        maxspeed    = .5;   // Metaballs' max speed per frame.

        setCanvasSizes();   // Resizes the main canvas to full window and the aux one to the downsampled size.
        queueResize = false;

        // Random metaballs' initialization.
        meatballs = [];
        for (var i = 0; i < nMeatballs ; i++) {
            var meatball = {    x:  Math.random() * auxCanvasWidth,
                                y:  Math.random() * auxCanvasHeight,
                                vx: (Math.random() * maxspeed * 2) - maxspeed,
                                vy: (Math.random() * maxspeed * 2) - maxspeed,
                                r:  Math.round(Math.random() * 105),
                                g:  Math.round(Math.random() * 155),
                                b:  Math.round(Math.random() * 155) };
            meatballs.push(meatball);
        }
        window.requestAnimFrame(update);
    };

    setCanvasSizes = function () {
        // Main canvas resized to fill the window.
        mainCanvas.width    = window.innerWidth;
        mainCanvas.height   = window.innerHeight;
        canvasWidth         = mainCanvas.width;
        canvasHeight        = mainCanvas.height;

        // Aux canvas resized to the downsample resolution.
        auxCanvasWidth      = Math.floor(canvasWidth  / downFactor);
        auxCanvasHeight     = Math.floor(canvasHeight / downFactor);
        auxCanvas.width     = auxCanvasWidth;
        auxCanvas.height    = auxCanvasHeight;

        // Obtain/reobtain the raw image data.
        imageData           = auxCtx.getImageData(0, 0, auxCanvasWidth, auxCanvasHeight);
        data                = imageData.data;

        // Clear both rendering surfaces.
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        auxCtx.clearRect(0, 0, auxCanvasWidth, auxCanvasHeight);
        
        radius      = canvasWidth / 50;   // Metaballs radius.
    };

    update = function() {
        if (queueResize) {
            setCanvasSizes();
            queueResize = false;
        }

        // Simple Euler integration - updates positions.
        for (var i = 0; i < nMeatballs; i++) {
            meatballs[i].x += meatballs[i].vx;
            meatballs[i].y += meatballs[i].vy;

            if (meatballs[i].x >= auxCanvasWidth || meatballs[i].x <= 0)
                meatballs[i].vx = -meatballs[i].vx;

            if (meatballs[i].y >= auxCanvasHeight || meatballs[i].y <= 0)
                meatballs[i].vy = -meatballs[i].vy;
        }

        for (var y = 0; y < auxCanvasHeight; ++y) {
            for (var x = 0; x < auxCanvasWidth; ++x) {
                var index = (y * auxCanvasWidth + x) * 4; // Solve the 1-dimensional index for the X, Y position, factoring the 4 value color model (RGBa). This is the "Red" position.

                var finalR = 0;
                var finalG = 0;
                var finalB = 0;

                for (i = 0; i < nMeatballs; i++) {
                    var val = solveEq(x, y, meatballs[i].x, meatballs[i].y, radius);

                    finalR += val * meatballs[i].r;
                    finalG += val * meatballs[i].g;
                    finalB += val * meatballs[i].b;
                }

                data[index]   = finalR;     // Red position.
                data[++index] = finalG;     // Green is next.
                data[++index] = finalB;     // Blue.
                data[++index] = 255;        // Alpha
            }
        }
        auxCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(auxCanvas, 0, 0, canvasWidth, canvasHeight);
        requestAnimFrame(update);
    };

    solveEq = function (x, y, _x, _y, r) {
        return r / Math.sqrt((x-_x)*(x-_x) + (y-_y)*(y-_y));
    };

    window.addEventListener('resize', function () {
        // Trigger a resize call in the next update/render loop.
        queueResize = true;
    }, false);

    window.addEventListener('DOMContentLoaded', init, false);
}());

// shim layer with setTimeout fallback
// Credit to Paul Irish http://bit.ly/fxq7EY
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame     ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.oRequestAnimationFrame       ||
        window.msRequestAnimationFrame      ||
        function( /* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();