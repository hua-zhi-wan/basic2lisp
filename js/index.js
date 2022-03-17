// Key Binding
document.onkeydown = function (event) {
    if (event.ctrlKey) {
        if (event.key === 'F9') {
            event.preventDefault();
            console.log('Compile');
            compile_basic();
        }
        if (event.key === 'F10') {
            event.preventDefault();
            console.log('Run');
            run_lisp();
        }
        if (event.key === 'F11') {
            event.preventDefault();
            console.log('Clear');
            clear_input();
        }
        if (event.key === 's' || event.key === 'S') {
            event.preventDefault();
            console.log('Save');
            save_code();
        }
    }
    if (event.key == 'Tab') {
        return false;
    }
}

function compile_basic() {
    var raw_code = $('#basic-code').value;

    var lisp_code = $('#lisp-code');
    var error_output = $('#error-output');
    var lisp_compile_info = basic(raw_code, true);

    lisp_code.value = lisp_compile_info.lisp_code === undefined ? '' : lisp_compile_info.lisp_code;
    error_output.innerHTML = lisp_compile_info.error === undefined ? '' : lisp_compile_info.error;
}

function run_lisp() {
    var lisp_code = $('#lisp-code').value;
    var return_output = $('#return-output');
    var std_output = $('#std-output');
    var error_output = $('#error-output');
    var ret = lisp(lisp_code, true);

    std_output.innerHTML = ret.sout.reduce(function(total, item){
        return total + item + '<br/>';
    }, '');
    return_output.innerHTML = ret.return !== undefined ? ret.return : '';
    error_output.innerText = ret.error !== undefined ? ret.error : '';
}

function clear_input() {
    $('#basic-code').value = '';
    $('#lisp-code').value = '';
}

var code_cache = [];
function save_code() {
    var basic_code = $('#basic-code').value;
    var lisp_code = $('#lisp-code').value;
    var memory_item = {
        'id': '#' + (Date.now() % 1000000),
        'basic': basic_code,
        'lisp': lisp_code
    };
    console.log(memory_item);
    update_code_memory(memory_item);
}

function update_code_memory(memory_item) {
    var cache_container = $('#cache-output');
    code_cache.unshift(memory_item);
    if (code_cache.length > 10) {
        code_cache.pop();
    }
    var cache_innerHTML = code_cache.reduce((total, item) => {
        return total + `<button onclick="load_code('${item.id}')">${item.id}</button>`;
    }, '');
    cache_container.innerHTML = cache_innerHTML;
}

function load_code(id) {
    var code_item = code_cache.find((item) => item.id === id);
    $('#basic-code').value = code_item.basic;
    $('#lisp-code').value = code_item.lisp;
}

var help_panel = $('.help-info')[0];
var help_flag = false;
function show_help() {
    help_panel.style.display = 'block';
    if (help_flag === false) {
        get_help();
    }
}
function hide_help() {
    help_panel.style.display = 'none';
}
hide_help();

function get_help() {
    var help_container = $('.help-content')[0];
    $.ajax('readme.md', 'GET', '', function (data) {
        help_flag = true;
        help_container.innerHTML = marked.parse(data);
    });
}