function basic(code, debug) {
    // function lex(code) {
    //     const lex_symbol = /[\(\);,]/;
    //     const lex_space = /\s/;

    //     const tok_stream = [];
    //     let tok = '';
    //     for (let i = 0; i < code.length; i += 1) {
    //         const cc = code.charAt(i);
    //         if (cc == "'") {
    //             while (i < code.length && code.charAt(i) !== '\n')
    //                 i += 1;
    //             continue;
    //         }

    //         if (cc.search(lex_symbol) >= 0) {
    //             if (tok.length > 0) {
    //                 tok_stream.push(tok);
    //                 tok = '';
    //             }
    //             tok_stream.push(cc);
    //         }
    //         else if (cc.search(lex_space) >= 0) {
    //             if (tok.length > 0) {
    //                 tok_stream.push(tok);
    //                 tok = '';
    //             }
    //         }
    //         else {
    //             tok += cc;
    //         }
    //     }

    //     return tok_stream;
    // }
    let error_output;

    function lex(code) {
        const lex_regex = /^[\(\);,]|([a-zA-Z_]\w*)|([\+\-]?[0-9]+(\.[0-9]+)?)|([<>]=)|[\+\-\*\/<>=]/;
        const lex_space = /^(\s+)/;
        const lex_comment = /^(\'.*\n)/;
        const tok_stream = [];
        let tmp_code = code;
        while (tmp_code.length > 0) {
            const startspace = tmp_code.match(lex_space);
            if (startspace && startspace[0]) {
                tmp_code = tmp_code.slice(startspace[0].length);
                continue;
            }

            const comment = tmp_code.match(lex_comment);
            if (comment && comment[0]) {
                tmp_code = tmp_code.slice(comment[0].length);
                continue;
            }

            const match = tmp_code.match(lex_regex);
            if (match && match[0]) {
                tok_stream.push(match[0]);
                tmp_code = tmp_code.slice(match[0].length);
                continue;
            }

            break;
        }
        return tok_stream;
    }

    function parse(tok_stream, root) {
        let pos = 0;
        const $Meta = {
            value: /^([\+\-]?)(\d+)(\.\d*)?$/,
            namestr: /[a-z_]+[a-z0-9_]*/,
            operator: /([\+\-\*\/\=\>\<])|(>=)|(<=)|(AND)|(OR)|(NOT)/,
            keyword(kw) {
                if (pos >= tok_stream.length) { return undefined; }
                if (kw === tok_stream[pos]) {
                    pos += 1;
                    return true;
                }
                return undefined;
            },
            get(reg) {
                if (pos >= tok_stream.length) { return undefined; }
                var str = tok_stream[pos];
                if (str.search(reg) >= 0) {
                    pos += 1;
                    return str;
                }
                return undefined;
            }
        };
        const $Parse = {
            $stack: [],
            $tag() { this.$stack.push(pos); },
            $pop() { this.$stack.pop(); },
            $back() { pos = this.$stack.pop(); },

            let() {
                this.$tag();
                if ($Meta.keyword('LET')) {
                    let namestr = $Meta.get($Meta.namestr);
                    if (namestr) {
                        if ($Meta.keyword("=")) {
                            let value = this.expression();
                            if (value && $Meta.keyword(";")) {
                                this.$pop();
                                return {
                                    type: 'LET',
                                    namestr,
                                    value,
                                }
                            }
                        }
                    }
                }
                this.$back();
                return undefined;
            },
            print() {
                // PRINT <output_value>
                this.$tag();
                if ($Meta.keyword('PRINT')) {
                    var output_value = this.expression();
                    if (output_value && $Meta.keyword(';')) {
                        this.$pop();
                        return {
                            type: 'PRINT',
                            value: output_value
                        };
                    }
                }
                this.$back();
                return undefined;
            },
            def() {
                this.$tag();
                // let function_name;
                // let arguments, argument;
                // let statements, statement;
                if ($Meta.keyword('DEF')) {
                    var function_name = $Meta.get($Meta.namestr);
                    if ($Meta.keyword('(')) {
                        var arguments = [];
                        var argument;
                        while ((argument = $Meta.get($Meta.namestr)) !== undefined) {
                            arguments.push(argument);
                            $Meta.keyword(',');
                        }
                        if ($Meta.keyword(')')) {
                            var statements = [];
                            var statement;
                            while ((statement = this.parseStatement()) !== undefined) {
                                statements.push(statement);
                            }
                            if ($Meta.keyword('END')) {
                                this.$pop();
                                return {
                                    type: 'FUNCTION',
                                    function_name,
                                    arguments,
                                    statements
                                };
                            }
                        }
                    }
                }
                this.$back();
                return undefined;
            },
            if() {
                this.$tag();
                if ($Meta.keyword('IF')) {
                    var bool_value = this.expression();
                    if (bool_value && $Meta.keyword('THEN')) {
                        var statements_if = [];
                        var smt;
                        while ((smt = this.parseStatement()) !== undefined) {
                            statements_if.push(smt);
                        }
                        if ($Meta.keyword('ELSE')) {
                            var statements_else = [];
                            var smt;
                            while ((smt = this.parseStatement()) !== undefined) {
                                statements_else.push(smt);
                            }
                            if ($Meta.keyword('END')) {
                                this.$pop();
                                return {
                                    type: 'IF',
                                    flag: bool_value,
                                    statements_if,
                                    statements_else
                                };
                            }
                        }
                    }
                }
                this.$back();
                return undefined;
            },
            justValue() {
                this.$tag();
                let value = this.expression();
                if (value && $Meta.keyword(';')) {
                    this.$pop();
                    return value;
                }
                this.$back();
                return undefined;
            },
            return() {
                this.$tag();
                if ($Meta.keyword('RETURN')) {
                    var return_val = this.expression();
                    if (return_val && $Meta.keyword(';')) {
                        this.$pop();
                        return {
                            type: 'RETURN',
                            return_val
                        };
                    }
                }
                this.$back();
                return undefined;
            },
            expression() {
                // simple_value
                this.$tag();
                var simple_value = $Meta.get($Meta.value);
                if (simple_value) {
                    this.$pop();
                    return simple_value;
                }
                this.$back();

                // function usage
                this.$tag();
                var function_name = $Meta.get($Meta.namestr);
                if (function_name) {
                    if ($Meta.keyword('(')) {
                        const arguments = [];
                        let argument;
                        while ((argument = this.expression()) !== undefined) {
                            arguments.push(argument);
                            $Meta.keyword(',');
                        }
                        if ($Meta.keyword(')')) {
                            this.$pop();
                            return {
                                type: 'USE',
                                function_name,
                                arguments
                            };
                        }
                    }
                }
                this.$back();

                // ( <left_val> <operator> <right_val> )
                this.$tag();
                if ($Meta.keyword('(')) {
                    var left_var = this.expression();
                    if (left_var) {
                        var operator = $Meta.get($Meta.operator);
                        if (operator) {
                            var right_var = this.expression();
                            if (right_var && $Meta.keyword(')')) {
                                this.$pop();
                                return {
                                    type: 'CALC',
                                    operator: operator.toLowerCase(),
                                    left_var,
                                    right_var
                                };
                            }
                        }
                    }
                }
                this.$back();

                // value_name
                this.$tag();
                var value_name = $Meta.get($Meta.namestr);
                if (value_name && !$Meta.keyword('(')) {
                    this.$pop();
                    return value_name;
                }
                this.$back();

                return undefined;
            },

            parseStatement() {
                return this.justValue() ||
                    this.let() ||
                    this.print() ||
                    this.if() ||
                    this.def() ||
                    this.return() || undefined;
            }
        };

        while (pos < tok_stream.length) {
            var ast_statement = $Parse.parseStatement();
            if (ast_statement) {
                root.push(ast_statement);
            }
            else {
                error_output = `PARSE ERROR AT ${pos} '${tok_stream[pos]}'`;
                console.log("PARSE ERROR >", $Parse.$stack, pos);
                break;
            }
        }
        return root;
    }


    function compile(ast) {
        function $compile(node) {
            if (node instanceof Array) {
                if (node.length === 1) {
                    return $compile(node[0]);
                }
                else {
                    return node.reduce(function (total, item) {
                        return total + ' ' + $compile(item);
                    }, '(begin') + ')';
                }
            }
            switch (node.type) {
                case undefined:
                    return node;
                case 'LET':
                    return '(define ' + node.namestr + ' ' + $compile(node.value) + ')';
                case 'PRINT':
                    return '(print ' + $compile(node.value) + ')';
                case 'CALC':
                    return '(' + node.operator + ' ' + $compile(node.left_var) + ' ' + $compile(node.right_var) + ')';
                case 'USE':
                    return node.arguments.reduce(function (total, item) {
                        return total + ' ' + $compile(item);
                    }, '(' + node.function_name) + ')';
                case 'IF':
                    return '(if ' + $compile(node.flag) + ' ' + $compile(node.statements_if) + ' ' + $compile(node.statements_else) + ')';
                case 'FUNCTION':
                    const params_str = '(' + node.arguments.reduce(function (total, item) {
                        return total + item + ' ';
                    }, '').slice(0, -1) + ') ';
                    let statements_str = $compile(node.statements);
                    if (statements_str.startsWith('(begin ')) { statements_str = statements_str.slice(7, -1); }
                    return '(define ' + node.function_name + ' (lambda ' + params_str + statements_str + ' ##))';
                case 'RETURN':
                    return '(define ## ' + $compile(node.return_val) + ')';
            }
            return '(?)';
        }

        return ast.reduce(function (total, item) {
            return total + $compile(item) + '\n';
        }, '');
    }

    var tok_stream = lex(code);
    if (debug) {
        console.log('Token Stream >', tok_stream);
    }

    var ast = parse(tok_stream, []);
    if (debug) {
        console.log(ast);
    }

    var lisp_code = compile(ast);
    if (debug) {
        console.log(lisp_code);
    }

    return {
        lisp_code,
        error: error_output,
    };
}

// LET x = 1 ;
// IF ( ( x < 2 ) AND ( x <= 1 ) ) THEN
//     LET a = 1 ;
//     PRINT 114514 ;
// ELSE
//     LET a = 0 ;
//     PRINT -1919810 ;
// END
// PRINT a ;


// DEF id ( x ) 
//     PRINT x ;
// END