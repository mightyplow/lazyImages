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
        return Array.prototype.slice.call(arraylike)
    }

    function moveAttribute (elem, oldAttribute, newAttribute) {
        elem.setAttribute(newAttribute, elem.getAttribute(oldAttribute))
        elem.removeAttribute(oldAttribute)
    }
    
    function extend (base, extension) {
        var extended = Object.create(base)
        return Object.assign(extended, extension)
    }

    // sourceAttribute gets set in the extending class
    // getSourceElements gets implemented in the extend class
    var lazyElement = {
        getLazySourceAttribute: function () {
            return lazySrcPrefix + this.sourceAttribute
        },

        storeSource: function (elem) {
            this.getSourceElements(elem).forEach(function (source) {
                moveAttribute(source, this.sourceAttribute, this.getLazySourceAttribute())
            }.bind(this))
        },

        restoreSource: function (elem) {
            this.getSourceElements(elem).forEach(function (source) {
                moveAttribute(source, this.getLazySourceAttribute(), this.sourceAttribute)
            }.bind(this))
        },

        hasSource: function (elem) {
            return this.getSourceElements(elem).every(function (source) {
                return !!source.getAttribute(this.sourceAttribute)
            }.bind(this))
        }
    }

    var lazyImage = extend(lazyElement, {
        sourceAttribute: 'src',

        getSourceElements: function (elem) {
            return [elem]
        }
    })

    var lazyPicture = extend(lazyElement, {
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
        items.forEach(function (item) {
            var target = item.target,
                imageHelper = getImageHelper(target)

            imageHelper.restoreSource(target)
            intersectionObserver.unobserve(target)
        })
    }

    function getMutationElements(mutations, selector) {
        return mutations.reduce(function (acc, item) {
            var nodes = toArray(item.addedNodes || [])

            nodes.forEach(function (node) {
                if (node instanceof HTMLElement) {
                    if (node.matches(selector)) {
                        acc.add(node)
                    }

                    node.querySelectorAll(selector).forEach(function (node) {
                        acc.add(node)
                    })
                }
            })

            return acc
        }, new Set())
    }

    var intersectionObserver = new IntersectionObserver(onGetVisible, intersectionObserverOptions)

    var mutationObserver = new MutationObserver(function (mutations) {
        console.time("mutations")
        var images = getMutationElements(mutations, 'img, picture')

        images.forEach(function (image) {
            var imageHelper = getImageHelper(image)

            if (imageHelper && imageHelper.hasSource(image)) {
                imageHelper.storeSource(image)
                intersectionObserver.observe(image)
            }
        })
        console.timeEnd("mutations")
    })

    mutationObserver.observe(document, mutationObserverOptions)
}(window, Object))