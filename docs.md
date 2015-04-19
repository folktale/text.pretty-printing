# module: `Text.PrettyPrinting`

- **Stability**: [![3. Stable](https://img.shields.io/badge/stability-3._Stable-green.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)
- **Portability**: Portable


 This module is an implementation of Wadler's [Pretty Printer][pp]. As described in the paper, the pretty printer is an efficient algebra that supports multiple adaptable layouts according to the available space. 

[pp]: http://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf 

## Dependencies






```js
var { Base }  = require('adt-simple');
var { curry } = require('core.lambda');
var { trampoline, done, ternary } = require('./tramp')

```
 

## Data structures





The pretty printer uses two algebras: 

The simple pretty printer is an algebra for documents that represents them as a concatenation of items. Each item may be one of the following: 
```js
union Doc {
  Nil,                  // Nothing, used as identity;
  Text(String, Doc),    // Some text;
  Line(Number, Doc)     // A line break, indented by a given amount;
} deriving (Base)

```
 

To allow (efficient) alternative layouts, a different algebra for documents is used, where we see things as a set of possible layouts for the same document. 

In this version we have more tags, since we add explicit representations for concatenation and nesting, and make some internal assumptions for the sake efficiency. These assumptions must be preserved whenever documents are built, and to enforce that, users are not given these structures to work with directly. 
```js
union DOC {
  NIL,                  // Nothing, used as identity;
  CONCAT(DOC, DOC),     // Joins two documents horizontally;
  NEST(Number, DOC),    // Indents a document by a given amount;
  TEXT(String),         // Represents plain text;
  LINE,                 // Represents explicit line breaks;
  UNION(DOC, DOC)       // A set of possible layouts for a document;
} deriving (Base)

DOC::concat = function(aDOC) {
  return CONCAT(this, aDOC)
}
DOC::nest = function(indent) {
  return NEST(indent, this)
}


```
 

## Helpers





### private function: `Repeat`


```hs
Int, String → String
```





Returns a String with `s` repeated `n` times. 

 
```js
function repeat(n, s) {
  return Array(n + 1).join(s)
}

```
 

### private function: `flatten`


```hs
DOC → DOC
```





Flatten replaces line breaks in a set of layouts by a single whitespace. It's defined privately so the invariants may hold. 

 
```js
function flatten {
  NIL            => NIL,
  CONCAT(a, b)   => CONCAT(flatten(a), flatten(b)),
  NEST(depth, a) => NEST(depth, flatten(a)),
  TEXT(s)        => TEXT(s),
  LINE           => TEXT(" "),
  UNION(a, b)    => flatten(a),
  a              => (function(){ throw new Error("No match: " + a) })();
}

```
 

### private function: `best`


```hs
Int, Int, DOC → DOC
```





Best chooses the best-looking alternative from a set of possible layouts a document may have. It takes into account the available layout for the rest of the document when doing so. 

 
```js
function best(width, indentation, doc) {
  return trampoline(go(width, indentation, [[0, doc]]));

```
 

#### private function: `go`


```hs
Int, Int, (Int, DOC) → Doc
```





 
```js
  function go(w, k, x) {
    return match x {
      []                         => done(Nil),
      [[i, NIL], ...xs]          => ternary(go, w, k, xs),
      [[i, CONCAT(x, y)], ...xs] => ternary(go, w, k, [[i, x], [i, y]] +++ xs),
      [[i, NEST(j, x)], ...xs]   => ternary(go, w, k, [[i + j, x]] +++ xs),
      [[i, TEXT(s)], ...xs]      => done(Text(s, trampoline(go(w, k + s.length, xs)))),
      [[i, LINE], ...xs]         => done(Line(i, trampoline(go(w, i, xs)))),
      [[i, UNION(x, y)], ...xs]  => done(better(w, k,
                                                trampoline(go(w, k, [[i, x]] +++ xs)),
                                                λ[trampoline(go(w, k, [[i, y]] +++ xs))]
                                               ))
    }
  }

```
 

#### private function: `better`


```hs
Int, Int, Doc, (Unit → Doc) → Doc
```





 
```js
  function better(w, k, x, y) {
    return fits(w - k, x)? x : y()
  }

```
 

#### private function: `fits`


```hs
Int, Doc → Boolean
```





 
```js
  function fits {
    (w, x) if w < 0 => false,
    (w, Nil)        => true,
    (w, Text(s, x)) => fits(w - s.length, x),
    (w, Line(i, x)) => true
  }
}

```
 

### private function: `layout`


```hs
Doc → String
```





Converts a simple document to a string. 

 
```js
function layout {
  Nil        => "",
  Text(s, a) => s + layout(a),
  Line(i, a) => '\n' + repeat(i, ' ') + layout(a)
}

```
 

### private function: `horizontalConcat`


```hs
DOC, DOC → DOC
```





Concatenates two documents horizontally, separated by a single space. 

 
```js
function horizontalConcat(x, y) {
  return x +++ text(" ") +++ y
}

```
 

### private function: `verticalConcat`


```hs
DOC, DOC → DOC
```





Concatenates two documents vertically, separated by a new line. 

 
```js
function verticalConcat(x, y) {
  return x +++ line() +++ y
}

```
 

### private function: `words`


```hs
String → Array(String)
```





Converts a string into a list of words. 

 
```js
function words(s) {
  return s.split(/\s+/)
}


```
 

## Primitives





Wadler's pretty printer define several primitive functions for working with the two aforementioned algebras. Combinators can be easily derived from these basic building blocks (and a few area also provided). 

### function: `nil`


```hs
Unit → DOC
```





Constructs an empty document. 

**Example**: 
```js

  pretty(80, nil()) // => ""

```
 


```js
function nil() {
  return NIL
}

```
 

### function: `concat`


```hs
DOC → DOC → DOC
```





Joins two documents horizontally, without any separation between them. 

**Example**: 
```js

  pretty(80, concat(text('a'), text('b'))) // => "ab"
  pretty(80, concat(text('a'), nil()))     // => "a"

```
 


```js
function concat(a, b) {
  return CONCAT(a, b)
}

```
 

### function: `nest`


```hs
Int → DOC → DOC
```





Indents a document a given amount of spaces. 

**Example**: 
```js

  pretty(80, stack([
    text('a'),
    text('b'),
    text('c')
  ])
  // => "a\n    b\n    c"

```
 


```js
function nest(depth, a) {
  return NEST(depth, a)
}

```
 

### function: `text`


```hs
String → DOC
```





Represents plain text in a document. 

**Example**: 
```js

  pretty(80, text("a")) // => "a"

```
 


```js
function text(s) {
  return TEXT(s)
}

```
 

### function: `line`


```hs
Unit → DOC
```





Represents a line break in a document. 

**Example**: 
```js

  pretty(80, concat(concat(text("a"), line()), text("b"))
  // => "a\nb"

```
 


```js
function line() {
  return LINE
}

```
 

### function: `group`


```hs
DOC → DOC
```





Creates a set of alternative layouts for the document. 

**Example**: 
```js

  pretty(5, group(stack([text('foo'), text('bar')])))
  // => "foo\nbar"

  pretty(10, group(stack([text('foo'), text('bar')])))
  // => "foo bar"

```
 


```js
function group(a) {
  return UNION(flatten(a), a)
}

```
 

## Conversions





### function: `pretty`


```hs
Int → DOC → String
```





Returns the best representation of a document for the given amount of horizontal space available, as a String. 

**Example**: 
```js

  pretty(80, spread([text('hello'), text('world')]))
  // => "hello world"

```
 


```js
function pretty(width, doc) {
  return layout(best(width, 0, doc))
}

```
 

## Combinators





### function: `foldDoc`


```hs
(DOC, DOC → DOC) → Array(DOC) → DOC
```





Allows folding over pairs of documents (similar to a catamorphism). 


```js
function foldDoc {
  (f, [])         => nil(),
  (f, [x])        => x,
  (f, [x, ...xs]) => f(x, foldDoc(f, xs))
}

```
 

### function: `spread`


```hs
Array(DOC) → DOC
```





Lays out a series of documents horizontally, with each document separated by a single space. 

**Example**: 
```js

  pretty(80, spread([text('foo'), text('bar')]))
  // => "foo bar"

```
 


```js
function spread(xs) {
  return foldDoc(horizontalConcat, xs)
}

```
 

### function: `stack`


```hs
Array(DOC) → DOC
```





Lays out a series of documents vertically, with each document separated by a single new line. 

**Example**: 
```js

  pretty(80, stack([text('foo'), text('bar')]))
  // => "foo\nbar"

```
 


```js
function stack(xs) {
  return foldDoc(verticalConcat, xs)
}

```
 

### function: `bracket`


```hs
Int → DOC → DOC → DOC → DOC
```





**Example**: 
```js

  pretty(5, bracket(2, '[', stack([
    text('a'), text('b'), text('c')
  ]), ']'))
  // => "[ \n  a\n  b\n  c \n ]"

```
 


```js
function bracket(indent, left, x, right) {
  return group(text(left)
           +++ nest(indent, line() +++ x)
           +++ line()
           +++ text(right))
}

```
 

### function: `join`


```hs
DOC → DOC → DOC
```





Joins two documents together, either by separating with a single horizontal space or a single new line. 


```js
function join(x, y) {
  return x +++ UNION(text(" "), line()) +++ y
}

```
 

### function: `fillWords`


```hs
String → DOC
```





Makes the best use of the available space for laying out words, either separated by a space or a new line. 


```js
function fillWords(s) {
  return foldDoc(join, words(s).map(text))
}

```
 

### function: `fill`


```hs
Array(DOC) → DOC
```





Makes the best use of the available space for layout out a series of documents, either separated by a space or a new line. 


```js
function fill {
  []            => nil(),
  [x]           => x,
  [x, y, ...zs] => UNION(horizontalConcat(flatten(x), fill([flatten(y)] +++ zs)),
                         verticalConcat(x, fill([y] +++ zs)))
}


```
 

## Exports






```js
module.exports = {
  nil       : nil,
  concat    : curry(2, concat),
  nest      : curry(2, nest),
  text      : text,
  line      : line,
  group     : group,
  pretty    : curry(2, pretty),
  foldDoc   : curry(2, foldDoc),
  spread    : spread,
  stack     : stack,
  bracket   : curry(4, bracket),
  join      : curry(2, join),
  fillWords : fillWords,
  fill      : fill
}

```
 

