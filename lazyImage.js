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

    function abstractMethod () {
        throw "Must be implemented"
    }

    var lazyElement = {
        getSourceAttribute: abstractMethod,

        getSourceElements: abstractMethod,

        getLazySourceAttribute: function () {
            return lazySrcPrefix + this.getSourceAttribute();
        },

        storeSource: function (elem) {
            this.getSourceElements(elem).forEach(function (source) {
                moveAttribute(source, this.getSourceAttribute(), this.getLazySourceAttribute())
            }.bind(this))
        },

        restoreSource: function (elem) {
            this.getSourceElements(elem).forEach(function (source) {
                moveAttribute(source, this.getLazySourceAttribute(), this.getSourceAttribute())
            }.bind(this))
        },

        hasSource: function (elem) {
            return this.getSourceElements(elem).every(function (source) {
                return !!source.getAttribute(this.getSourceAttribute())
            }.bind(this))
        }
    }

    var lazyImage = Object.create(lazyElement, {
        getSourceAttribute: {
            value: function () {
                return 'src'
            }
        },

        getSourceElements: {
            value: function (elem) {
                return [elem]
            }
        }
    })

    var lazyPicture = Object.create(lazyElement, {
        getSourceAttribute: {
            value: function () {
                return 'srcset'
            }
        },

        getSourceElements: {
            value: function (elem) {
                return toArray(elem.querySelectorAll('source'))
            }
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
        var images = getMutationElements(mutations, 'img, picture')

        images.forEach(function (image) {
            var imageHelper = getImageHelper(image)

            if (imageHelper && imageHelper.hasSource(image)) {
                imageHelper.storeSource(image)
                intersectionObserver.observe(image)
            }
        })
    })

    mutationObserver.observe(document, mutationObserverOptions)
}(window, Object))