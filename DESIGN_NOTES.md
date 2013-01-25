JS Notes Pertinent to JSGBC
===========================

This is a collection of notes that will assist in making design decisions for the ***grantgalitz/GameBoy-Online*** rewrite. These are concerned with increasing *performance, clarity, and cleanliness*.

Main Loop
===========================

*  Grant used ***setInterval***.
    *  It's set to run every ***4ms***.
	*  60fps is about 17ms. 
    *  How fast does the GameBoy Color update?
    *  Why not ***requestAnimationFrame***?
        *  Is requestAnimationFrame faster?

Canvas
===========================

Variables
---------------------------
*  ***frameBuffer*** is the GBC internal frame buffer
    *  3 bits per pixel (RGB)
*  ***canvasBuffer*** is the HTML5 canvas frame buffer
    *  4 bits per pixel (RGBA)

Drawing
---------------------------

*  ***getImageData*** and ***putImageData*** are slow.
    *  ***drawImage*** is fast.
*  Way Grant gets pixels on the canvas:
    1. ***frameBuffer*** is populated from ***???***
	2. ***canvasBuffer*** is populated from ***frameBuffer***
	3. An offscreen canvas calls ***putImageData*** to fill itself with values from ***canvasBuffer***
	4. The onscreen canvas calls ***drawImage*** to fill itself with values from the offscreen canvas.

Scaling
---------------------------

*  Nearest-neighbor scaling is faster.
    *  How much faster?