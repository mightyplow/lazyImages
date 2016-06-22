(function (window, Object) {
    var MutationObserver = window['MutationObserver'],
        IntersectionObserver = window['IntersectionObserver'],
        Set = window['Set']

    // breaks the script if any of the requirements aren't fulfilled
    if (!(MutationObserver && IntersectionObserver && Set)) {
        return
    }

    // prefix for the attribute, where the original source gets stored in
    var lazySrcPrefix = 'data-'

    var intersectionObserverOptions = {
        threshold: 0
    }

    var mutationObserverOptions = {
        childList: true,
        subtree: true
    }

    // helper function to convert arraylike objects into arrays
    function toArray (arraylike) {
        return Array.prototype.slice.call(arraylike || [])
    }

    // helper function to call the foreach method on a given array
    // layed out into an extra function to reduce minimified size
    function forEach (iterable, fn) {
        iterable.forEach(fn)
    }

    // finds childelements with a given selector
    function findChildren (selector) {
        return toArray(this.querySelectorAll(selector))
    }

    // create a function, which moves an attribute to another attrubute
    // sourceGetter is a function which returns elements, from which the sourceAttribute
    // gets moved
    function createAttributeMoveFunction (sourceGetter, sourceAttribute, targetAttribute) {
        return forEach.bind(null, sourceGetter(), function (source) {
            var sourceValue = source.getAttribute(sourceAttribute)

            if (sourceValue) {
                source.setAttribute(targetAttribute, sourceValue)
                source.removeAttribute(sourceAttribute)
            }
        })
    }

    // function which puts an element into an array
    function getImageSources () {
        return [this]
    }

    // creates a helper object for image or picture elements
    // with methods to store and restore the source attributes
    function getImageHelper (elem) {
        var sourceAttribute,
            backupAttribute,
            sourceGetter

        if (elem instanceof HTMLImageElement) {
            sourceAttribute = 'src'
            sourceGetter = getImageSources.bind(elem)
        } else if (elem instanceof HTMLPictureElement) {
            sourceAttribute = 'srcset'
            sourceGetter = findChildren.bind(elem, 'source')
        } else {
            return
        }

        backupAttribute = lazySrcPrefix + sourceAttribute

        return {
            storeSource: createAttributeMoveFunction(sourceGetter, sourceAttribute, backupAttribute),
            restoreSource: createAttributeMoveFunction(sourceGetter, backupAttribute, sourceAttribute)
        }
    }

    // callback for intersection observer which restores the backuped source attribute
    function onGetVisible (items) {
        forEach(items, function (item) {
            var target = item.target,
                imageHelper = getImageHelper(target)

            imageHelper.restoreSource()
            intersectionObserver.unobserve(target)
        })
    }

    // function for mutation observer which calls a callback on elements which
    // match the given selector
    function onMutationElements (mutations, selector, elementCallback) {
        forEach(mutations, function (item) {
            forEach(item.addedNodes, function (node) {
                if (node.matches) {
                    if (node.matches(selector)) {
                        elementCallback(node)
                    } else {
                        forEach(findChildren.call(node, selector), elementCallback)
                    }
                }
            })
        })
    }

    var intersectionObserver = new IntersectionObserver(onGetVisible, intersectionObserverOptions)

    // creates an mutation observer which looks for img and picture elements
    // and stores the sources of the images in an extra attribute to prevent immediate loading
    // of the image
    //
    // the images get visible again, when the intersection observer recognizes them to be in the viewport
    var mutationObserver = new MutationObserver(function (mutations) {
        var processedItems = new Set()

        onMutationElements(mutations, 'img, picture', function (image) {
            if (processedItems.has(image)) {
                return
            }

            var imageHelper = getImageHelper(image)

            if (imageHelper) {
                imageHelper.storeSource()
                intersectionObserver.observe(image)
            }

            processedItems.add(image)
        })
    })

    mutationObserver.observe(document, mutationObserverOptions)
}(window, Object))