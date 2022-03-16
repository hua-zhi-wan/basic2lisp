function $(selector) {
    switch (selector[0]) {
        case '#':
            return document.getElementById(selector.slice(1));
        case '.':
            return document.getElementsByClassName(selector.slice(1));
        default:
            return document.getElementsByTagName(selector);
    }
}

$.ajax = function (url, method, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                callback(xhr.responseText);
            }
            else {
                console.log('ajax error');
            }
        }
    };
    xhr.send(data);
};