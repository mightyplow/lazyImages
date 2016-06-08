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

    function moveAttribute (elem, oldAttribute, newAttribute) {
        elem.setAttribute(newAttribute, elem.getAttribute(oldAttribute))
        elem.removeAttribute(oldAttribute)
    }
    
    function forEach (iteratable, fn) {
        iteratable.forEach(fn)
    }

    // sourceAttribute gets set in the extending class
    // getSourceElements gets implemented in the extending class
    var lazyElement = {
        getLazySourceAttribute: function () {
            return lazySrcPrefix + this.sourceAttribute
        },

        moveSourceAttributes: function (elem, sourceAttribute, targetAttribute) {
            forEach(this.getSourceElements(elem), function (source) {
                moveAttribute(source, sourceAttribute, targetAttribute)
            })
        },
        
        storeSource: function (elem) {
            this.moveSourceAttributes(elem, this.sourceAttribute, this.getLazySourceAttribute())
        },

        restoreSource: function (elem) {
            this.moveSourceAttributes(elem, this.getLazySourceAttribute(), this.sourceAttribute)
        }
    }

    var lazyImage = Object.assign({}, lazyElement, {
        sourceAttribute: 'src',

        getSourceElements: function (elem) {
            return [elem]
        }
    })

    var lazyPicture = Object.assign({}, lazyElement, {
        sourceAttribute: 'srcset',

        getSourceElements: function (elem) {
            return toArray(elem.querySelectorAll('source'))
        }
    })

    function getImageHelper (elem) {
        if (elem instanceof HTMLImageElement) {
            return lazyImage
        } else if (elem instanceof HTMLPictureElement) {
            return lazyPicture
        }

        return null
    }
    
    function onGetVisible (items) {
        forEach(items, function (item) {
            var target = item.target,
                imageHelper = getImageHelper(target)

            imageHelper.restoreSource(target)
            intersectionObserver.unobserve(target)
        })
    }

    function getMutationElements(mutations, selector) {
        return mutations.reduce(function (acc, item) {
            var nodes = toArray(item.addedNodes || [])

            forEach(nodes, function (node) {
                if (node.matches) {
                    if (node.matches(selector)) {
                        acc.add(node)
                    }

                    forEach(node.querySelectorAll(selector), acc.add.bind(acc))
                }
            })

            return acc
        }, new Set())
    }

    var intersectionObserver = new IntersectionObserver(onGetVisible, intersectionObserverOptions)

    var mutationObserver = new MutationObserver(function (mutations) {
        console.time("mutations")
        var images = getMutationElements(mutations, 'img, picture')

        forEach(images, function (image) {
            var imageHelper = getImageHelper(image)

            if (imageHelper) {
                imageHelper.storeSource(image)
                intersectionObserver.observe(image)
            }
        })
        console.timeEnd("mutations")
    })

    mutationObserver.observe(document, mutationObserverOptions)
}(window, Object))