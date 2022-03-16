# Basic2Lisp
A "Basic-to-Lisp" compiler.  
But Basic is not real Basic, and Lisp is not real Lisp.

## Syntax

### Print-Sth
Put some-value to standard output.
```basic
PRINT value;
```
```lisp
(print value)
```

### Comment
```basic
' here are the comments
```
```lisp
; here are the comments
```

### Value
```basic
' Simple Value
114514
' Operator Expression
(1919 + 810)
' Function
abs(-10)
```
```lisp
; Simple Value
114514
; Operator Expression
(+ 1919 810)
; Function
(abs -10)
```

BASIC value cannot exist as a statement, but with a semicolon (`;`).
```BASIC
1;
```

### Complex Expression
In this basic project, we use `(` and `)` to express every complex expressions.
```basic
LET complex_expr = (((1 + 2) * 3) - (4 / 5));
```

So that, we do not need to consider operator priority and left recursion.

### Value-Binding : define & LET
Bind some value to a fixed name.

```basic
LET homo = 114514;
PRINT homo;
```
```lisp
(define homo 114514)
(print homo)
```

Unlike basic, we can use `define` to name a function.
```lisp
(define show print)
(show 1919810)
```

### Function : DEF & lambda
Construct a function.

```basic
DEF id(x)
    RETURN x;
END
```
```lisp
(define id
    (lambda (x) x))
```

Unlike basic, we can construct a procedure(function) without name. It can also used as usual.
```lisp
(+ 
    ((lambda (x) (* x x)) 100) 
    104514)
```

## Demo

### Fibonacci
```basic
DEF fib(x)
    IF (x < 2) THEN
        RETURN 1;
    ELSE
        RETURN (fib((x - 1)) + fib((x - 2)));
    END
END
```

```lisp
(define fib
    (lambda (x)
        (if (< x 2)
            1
            (+ (fib (- x 1)) (fib (- x 2))))))
```

### Square Root
```basic
' sqrt
DEF sqrt(x)
    DEF abs(x)
        IF (x > 0) THEN
            RETURN x;
        ELSE
            RETURN (0 - x);
        END
    END

    DEF good_enough(g,w)
        RETURN (abs(((g * g) - w)) < (g / 100000));
    END

    DEF guess(g,w)
        IF good_enough(g,w) THEN
            RETURN g;
        ELSE
            RETURN guess(improve(g,w),w);
        END
    END

    DEF improve(g,w)
        RETURN ((g + (w / g)) / 2);
    END

    RETURN guess(1,x);
END

PRINT sqrt(1919810);
```
```lisp
; sqrt
(define sqrt
    (lambda (x) 
        (define abs (lambda (x) (if (> x 0) x (- x))))
        (define good-enough?
            (lambda (g w)
                (< (abs (- (* g g) w)) (/ g 100000))))
        (define guess
            (lambda (g w)
                (if (good-enough? g w)
                    g
                    (guess (improve g w) w))))
        (define improve
            (lambda (g w)
                (/ (+ g (/ w g)) 2)))
        (guess 1 x)))

(print (sqrt 1919810))
```

### Cons | Car | Cdr
```basic
DEF cons(x,y)
    DEF temp(op)
        RETURN op(x,y);
    END
    RETURN temp;
END

DEF car(cons)
    DEF temp(x,y)
        RETURN x;
    END
    RETURN cons(temp);
END

' (1,2) => 1
car(cons(1,2));
```
```lisp
(define cons
    (lambda (a d)
        (lambda (op) (op a d))))

(define car
    (lambda (cons)
        (cons (lambda (a d) a))))

; (1,2) => 1
(car (cons 1 2))
```

## Others

### Shortcut keys
+ Ctrl + F9 : Compile
+ Ctrl + F10 : Run
+ Ctrl + F11 : Clear
+ Ctrl + S : Save

