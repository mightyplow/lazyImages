(function (window, Object, undefined) {
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
        return function () {
            forEach(sourceGetter(), function (source) {
                var sourceValue = source.getAttribute(sourceAttribute)

                if (sourceValue) {
                    source.setAttribute(targetAttribute, sourceValue)
                    source.removeAttribute(sourceAttribute)
                }
            })
        }
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

    function getMutationElements(mutations, selector) {
        return mutations.reduce(function (acc, item) {
            forEach(item.addedNodes, function (node) {
                if (node.matches) {
                    if (node.matches(selector)) {
                        acc.add(node)
                    } else {
                        forEach(findChildren(node, selector), acc.add.bind(acc))
                    }
                }
            })

            return acc
        }, new Set())
    }

    var intersectionObserver = new IntersectionObserver(onGetVisible, intersectionObserverOptions)

    var mutationObserver = new MutationObserver(function (mutations) {
        var images = getMutationElements(mutations, 'img, picture')

        forEach(images, function (image) {
            var imageHelper = getImageHelper(image)

            if (imageHelper) {
                imageHelper.storeSource()
                intersectionObserver.observe(image)
            }
        })
    })

    mutationObserver.observe(document, mutationObserverOptions)
}(window, Object))