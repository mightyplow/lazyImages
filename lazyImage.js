(function (window) {
    var MutationObserver = ('MutationObserver' in window) && window.MutationObserver,
        IntersectionObserver = ('IntersectionObserver' in window) && window.IntersectionObserver,
        Set = ('Set' in window) && window.Set

    if (!(MutationObserver && IntersectionObserver && Set)) {
        return
    }

    var lazySrcAttribute = 'data-src'

    var intersectionObserverOptions = {
        threshold: 0
    }

    var mutationObserverOptions = {
        childList: true,
        subtree: true,
        attributeFilter: ['src', 'srcset']
    }

    function toArray (arraylike) {
        return Array.prototype.slice.call(arraylike)
    }

    var lazyImage = (function () {
        var sourceAttribute = 'src'

        return {
            storeSource: function (elem) {
                elem.setAttribute(lazySrcAttribute, elem.getAttribute(sourceAttribute))
                elem.removeAttribute(sourceAttribute)
            },

            restoreSource: function (elem) {
                elem.setAttribute(sourceAttribute, elem.getAttribute(lazySrcAttribute))
                elem.removeAttribute(lazySrcAttribute)
            },

            hasSource: function (elem) {
                return !!elem.getAttribute(sourceAttribute)
            }
        }
    }())

    var lazyPicture = (function () {
        var sourceAttribute = 'srcset'

        return {
            storeSource: function (elem) {
                elem.querySelectorAll('source').forEach(function (source) {
                    source.setAttribute(lazySrcAttribute, source.getAttribute(sourceAttribute))
                    source.removeAttribute(sourceAttribute)
                })
            },

            restoreSource: function (elem) {
                elem.querySelectorAll('source').forEach(function (source) {
                    source.setAttribute(sourceAttribute, source.getAttribute(lazySrcAttribute))
                    source.removeAttribute(lazySrcAttribute)
                })
            },

            hasSource: function (elem) {
                return toArray(elem.querySelectorAll('source')).every(function (source) {
                    return !!source.getAttribute(sourceAttribute)
                })
            }
        }
    }())

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
            if (item.addedNodes) {
                var nodes = toArray(item.addedNodes)

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
            }

            return acc
        }, new Set())
    }

    var intersectionObserver = new IntersectionObserver(onGetVisible, intersectionObserverOptions)

    var mutationObserver = new MutationObserver(function (mutations) {
        var images = getMutationElements(mutations, 'img, picture')

        images.forEach(function (image) {
            var imageHelper = getImageHelper(image)

            if (imageHelper.hasSource(image)) {
                imageHelper.storeSource(image)
                intersectionObserver.observe(image)
            }
        })
    })

    mutationObserver.observe(document, mutationObserverOptions)
}(window))