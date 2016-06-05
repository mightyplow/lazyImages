# lazyImages
JavaScript snippet to let images and pictures be loaded lazily

The snippet uses the new IntersectionObserver (since Chrome 51) and the [MutationObserver](http://caniuse.com/#feat=mutationobserver) to let img and picture elements be loaded, when they get visible.

If one of the observers is not available, the images get loaded normally.

# Usage
Just include a script tag with the source to the javascript file in the head section of the html document to make the lazy loading available right from the start.

# Minimization
The snippet was minimized via [uglify-js](https://github.com/mishoo/UglifyJS2).

The functions and properties got mangled. In order to prevent uglify-js from mangeling some necessary properties, the 
--reserved-file option was used with the reserved.json file containing the declared properties.

The whole command for minimization looks like this:
```
uglifyjs lazyImage.js -m --mangle-props --reserved-file reserved.json > lazyImage.min.js
```