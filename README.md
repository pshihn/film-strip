# \<film-strip\>

A custom element for the web to show the frames of a video. You can configure the **frame rate** and the **cell size** of the film strip. Can be used with any framework or on plain old html. 

See it in action: https://pshihn.github.io/film-strip/

The strip uses a virtual scroller and lazy loads the frames as they come into view for better performance. It's also *less than 3KB* in size when gzipped. 

## Usage

The element is shipped as an ES Module. 

Install from npm:

```
npm install --save film-strip-element
```

Or you can use directly in the browser:

```html
<film-strip src="./sample.mp4"></film-strip>
<script type="module" src="https://unpkg.com/film-strip-element"></script>
```

Sandbox: https://codesandbox.io/s/film-strip-demo-nsgef

## Variations

You can set the frame-rate, height of each cell, and the mime type of the video as an attribute or as a property of the object. 

e.g. Sampling the video at a frame rate of 3 frames per second, rendering a film strip where each cell is 200px tall.

```html
<film-strip src="./sample.mp4" rate="3" height="200"></film-strip>
```
