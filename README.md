# lazyImages
A tiny JavaScript snippet to let images and pictures be loaded lazily (when they get visible). It's less then 650B when 
transferred gzipped.

The snippet uses the new [IntersectionObserver](https://github.com/WICG/IntersectionObserver/blob/gh-pages/explainer.md) 
(since Chrome 51) and the [MutationObserver](http://caniuse.com/#feat=mutationobserver) to let img and picture elements 
be loaded when they get visible.

If one of the observers is not available, the images get loaded normally.

# Usage
Just include a script tag with the source to the javascript file in the head section of the html document to make the 
lazy loading available right from the start.

# Notice
In order to make the visibility check working properly, the images should have a defined width and height, either via
the HTML attributes or via CSS.

# Minification
The snippet was minimized via [uglify-js](https://github.com/mishoo/UglifyJS2).

The functions and properties got mangled. In order to prevent uglify-js from mangeling some necessary properties, the 
--reserved-file option was used with the reserved.json file containing the declared properties.

The whole command for minification looks like this:
```
uglifyjs lazyImage.js -m --mangle-props --reserved-file reserved.json > lazyImage.min.js
```