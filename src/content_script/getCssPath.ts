// https://stackoverflow.com/questions/3620116/get-css-path-from-dom-element#comment29091811_12222317
export const getCssPath = (el: any) => {
    if (!(el instanceof Element))
        return;
    var path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        // if (el.id) {
        //     selector += '#' + el.id;
        //     path.unshift(selector);
        //     break;
        // } else {
            var sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector)
                    nth++;
            }
            if (el.previousElementSibling != null || el.nextElementSibling != null)
                selector += ":nth-of-type(" + nth + ")";
        // }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(" > ");
}