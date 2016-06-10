(function (window, Object) {
    var MutationObserver = window['MutationObserver'],
        IntersectionObserver = window['IntersectionObserver'],
        Set = window['Set']

    if (!(MutationObserver && IntersectionObserver && Set)) {
        return
    }

    var lazySrcPrefix = 'data-'

    var intersectionObserverOptions = {
        threshold: 0
    }

    var mutationObserverOptions = {
        childList: true,
        subtree: true
    }

    function toArray (arraylike) {
        return arraylike && Array.prototype.slice.call(arraylike) || []
    }

    function forEach (iteratable, fn) {
        iteratable.forEach(fn)
    }

    function findChildren (element, selector) {
        return toArray(element.querySelectorAll(selector))
    }


    function createAttributeMoveFunction (sourceGetter, sourceAttribute, targetAttribute) {
        return forEach.bind(null, sourceGetter(), function (source) {
            var sourceValue = source.getAttribute(sourceAttribute)

            if (sourceValue) {
                source.setAttribute(targetAttribute, sourceValue)
                source.removeAttribute(sourceAttribute)
            }
        })
    }

    function getImageSources () {
        return [this]
    }

    function getImageHelper (elem) {
        var sourceAttribute,
            backupAttribute,
            sourceGetter

        if (elem instanceof HTMLImageElement) {
            sourceAttribute = 'src'
            sourceGetter = getImageSources.bind(elem)
        } else if (elem instanceof HTMLPictureElement) {
            sourceAttribute = 'srcset'
            sourceGetter = findChildren.bind(undefined, elem, 'source')
        } else {
            return
        }

        backupAttribute = lazySrcPrefix + sourceAttribute

        return {
            storeSource: createAttributeMoveFunction(sourceGetter, sourceAttribute, backupAttribute),
            restoreSource: createAttributeMoveFunction(sourceGetter, backupAttribute, sourceAttribute)
        }
    }
    
    function onGetVisible (items) {
        forEach(items, function (item) {
            var target = item.target,
                imageHelper = getImageHelper(target)

            imageHelper.restoreSource()
            intersectionObserver.unobserve(target)
        })
    }

    function onMutationElements (mutations, selector, elementCallback) {
        forEach(mutations, function (item) {
            forEach(item.addedNodes, function (node) {
                if (node.matches) {
                    if (node.matches(selector)) {
                        elementCallback(node)
                    } else {
                        forEach(findChildren(node, selector), elementCallback)
                    }
                }
            })
        })
    }

    var intersectionObserver = new IntersectionObserver(onGetVisible, intersectionObserverOptions)

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