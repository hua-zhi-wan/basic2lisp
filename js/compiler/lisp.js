function lisp(code, debug) {
    let error_output;

    const lex_boundary = /[\s\(\)\[\]\{\}]/;
    const lex_braces_left = /[\(\[\{]/;
    const lex_braces_right = /[\)\]\}]/;
    const lex_string = /^([\'\"]).*\1$/;

    function lex(code) {
        const tok_stream = [];
        let tok = '';
        let braces_counter = 0;
        for (let i = 0; i < code.length; i += 1) {
            const cc = code.charAt(i);
            if (cc === ';') {
                while (i < code.length
                    && code.charAt(i) !== '\n')
                    i += 1;
                continue;
            }

            if (cc.search(lex_boundary) >= 0) {
                if (tok.length !== 0) {
                    tok_stream.push(tok);
                    tok = '';
                }
                if (cc.search(lex_braces_left) >= 0) {
                    tok_stream.push(cc);
                    braces_counter += 1;
                }
                else if (cc.search(lex_braces_right) >= 0) {
                    tok_stream.push(cc);
                    braces_counter -= 1;
                }
            }
            else {
                tok += cc;
            }
        }
        if (tok.length !== 0) tok_stream.push(tok);

        if (braces_counter === 0)
            return tok_stream;
        else
            return [];
    }

    function parse(tok_stream, root) {
        function $analyze(str) {
            const num = Number.parseFloat(str);
            return isNaN(num) ? str : num;
        }
        function $parse(node) {
            while (tok_stream.length > 0) {
                const tok = tok_stream.shift();
                if (tok === '(')
                    node.push($parse([]));
                else if (tok === ')')
                    return node;
                else
                    node.push($analyze(tok));
            }
            return node;
        }
        return $parse(root ? root : []);
    }

    const lambda_to_string = function () { return '#lambda'; };
    const default_env = {
        'print'(args) {
            standard_output.push(args.reduce(function (total, item) {
                return total + item + ' ';
            }, ''));
            return undefined; //args[args.length - 1];
        },
        '+'(args) {
            let plus = 0;
            args.forEach(function (x) { plus += x; });
            return plus;
        },
        '-'(args) {
            if (args.length === 1) {
                return -args[0];
            }
            let minus = args[0] * 2;
            args.forEach(function (x) { minus -= x; });
            return minus;
        },
        '*'(args) {
            let times = 1;
            args.forEach(function (x) { times *= x; });
            return times;
        },
        '/'(args) {
            let div = args[0] * args[0];
            args.forEach(function (x) { div /= x; });
            return div;
        },
        '='(args) {
            return args[0] === args[1];
        },
        '!='(args) {
            return args[0] !== args[1];
        },
        '>'(args) {
            return args[0] > args[1];
        },
        '<'(args) {
            return args[0] < args[1];
        },
        '>='(args) {
            return args[0] >= args[1];
        },
        '<='(args) {
            return args[0] <= args[1];
        },
        '?'() {
            standard_output.push('!!!ERROR!!!');
            return undefined;
        }
    }
    for (let item in default_env) { default_env[item].toString = lambda_to_string; }

    function execute(root, env) {
        function $lambda(params, exp, parent_env) {
            const func = function (args) {
                const next_env = { ...parent_env };
                for (let i = 0; i < args.length; i += 1) {
                    next_env[params[i]] = $calc(args[i], next_env);
                }
                return $begin(exp, next_env);
            }
            func.toString = lambda_to_string;
            return func;
        }
        function $calc(node, env) {
            if (!(node instanceof Array)) {
                if (typeof (node) === 'string') {
                    const val = env[node];
                    if (val === undefined) {
                        error_output = `Undefined variable: ${node}`;
                    }
                    return val;
                }
                return node;
            }
            switch (node[0]) {
                case 'if':
                    if ($calc(node[1], env))
                        return $calc(node[2], env);
                    else
                        return $calc(node[3], env)

                case 'and':
                    if (!$calc(node[1], env))
                        return false;
                    else
                        return $calc(node[2], env);

                case 'or':
                    if ($calc(node[1], env))
                        return true;
                    else
                        return $calc(node[2], env);

                case 'lambda':
                    return $lambda(node[1], node.slice(2), env);

                case 'define':
                    const tmp = $calc(node[2], env);
                    env[node[1]] = tmp;
                    return undefined; //tmp;

                case 'begin':
                    let ret;
                    for (let ii = 1; ii < node.length; ii += 1) {
                        ret = $calc(node[ii], env);
                    }
                    return ret;

                default:
                    const head = $calc(node[0], env);
                    return $run(head, node.slice(1), env);
            }
        }
        function $run(fn, args, env) {
            args = args.map(function (x) { return $calc(x, env); });
            if (typeof (fn) === 'function')
                return fn(args);
            error_output = `Not a Function: ${fn}`;
        }
        function $begin(node_array, env) {
            let ret;
            node_array.forEach(function (node) {
                ret = $calc(node, env);
            })
            return ret;
        }

        return $begin(root, env);
    }

    const standard_output = [];

    const tok_stream = lex(code);
    if (debug) console.log("Token Stream >", tok_stream);

    const node_root = parse(tok_stream);
    if (debug) console.log("Node List >", node_root);

    const return_val = execute(node_root, default_env);
    if (debug) console.log("Return >", return_val);

    return {
        return: return_val,
        sout: standard_output,
        error: error_output,
    };
}

// lisp(`
// (+ 1 2)
// `, true);


/*
; sqrt
(define sqrt
    (lambda (x) 
        (define abs (lambda (x) (if (> x 0) x (- x))))
        (define good-enough?
            (lambda (g w)
                (< (abs (- (* g g) w)) 0.0001)))
        (define guess
            (lambda (g w)
                (if (good-enough? g w)
                    g
                    (guess (improve g w) w))))
        (define improve
            (lambda (g w)
                (/ (+ g (/ w g)) 2)))
        (guess 1 x)))
(sqrt 1000)
*/

/*
; fib
(define fib (lambda (n)
    (if (< n 2) 1
    (+ (fib (- n 1)) (fib (- n 2))))))

(fib 10)
*/

/*
(define cons
    (lambda (a d)
        (lambda (op) (op a d))))

(define car
    (lambda (cons)
        (cons (lambda (a d) a))))

(car (cons 1 2))
*/