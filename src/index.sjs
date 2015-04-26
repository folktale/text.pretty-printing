// # module: Text.PrettyPrinting
//
// @stability:   Stable
// @portability: Portable
// @platform:    ECMAScript 5
// @synopsis:    Compositional pretty printer supporting multiple layouts.
//
// This module is an implementation of Wadler's @link(text: "Pretty Printer").
// As described in the paper, the pretty printer is an efficient
// algebra that supports multiple adaptable layouts according to the
// available space.
//
// @ref("Pretty Printer"): http://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf

// -- Dependencies -----------------------------------------------------
var { Base }  = require('adt-simple');
var { curry } = require('core.lambda');
var { Done, trampoline, done, ternary, binary, nary } = require('./tramp')

// -- Data structures --------------------------------------------------
//
// The pretty printer uses two algebras:
//
// The simple pretty printer is an algebra for documents that
// represents them as a concatenation of items. Each item may be one
// of the following:
union Doc {
  Nil,                  // Nothing, used as identity;
  Text(String, Doc),    // Some text;
  Line(Number, Doc)     // A line break, indented by a given amount;
} deriving (Base)

// To allow (efficient) alternative layouts, a different algebra
// for documents is used, where we see things as a set of possible
// layouts for the same document.
//
// In this version we have more tags, since we add explicit representations
// for concatenation and nesting, and make some internal assumptions
// for the sake efficiency. These assumptions must be preserved whenever
// documents are built, and to enforce that, users are not given these
// structures to work with directly.
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


// -- Helpers ----------------------------------------------------------

// ### function: Repeat
// Returns a String with `s` repeated `n` times.
//
// @private
// @type: Int, String → String
function repeat(n, s) {
  return Array(n + 1).join(s)
}

// ### function: flatten
// Flatten replaces line breaks in a set of layouts by a single
// whitespace. It's defined privately so the invariants may hold.
//
// @private
// @type: DOC → DOC
function flatten {
  NIL            => NIL,
  CONCAT(a, b)   => CONCAT(flatten(a), flatten(b)),
  NEST(depth, a) => NEST(depth, flatten(a)),
  TEXT(s)        => TEXT(s),
  LINE           => TEXT(" "),
  UNION(a, b)    => flatten(a),
  a              => (function(){ throw new Error("No match: " + a) })();
}

// ### function: best
// Best chooses the best-looking alternative from a set of possible
// layouts a document may have. It takes into account the available
// layout for the rest of the document when doing so.
//
// @private
// @type: Int, Int, DOC → DOC
function best(width, indentation, doc) {
  return trampoline(go(width, indentation, [[0, doc]]));

  // #### function: go
  // @private
  // @type: Int, Int, (Int, DOC) → Doc
  function go(w, k, x) {
    return match x {
      []                         => done(Nil),
      [[i, NIL], ...xs]          => ternary(go, w, k, xs),
      [[i, CONCAT(x, y)], ...xs] => ternary(go, w, k, [[i, x], [i, y]] +++ xs),
      [[i, NEST(j, x)], ...xs]   => ternary(go, w, k, [[i + j, x]] +++ xs),
      [[i, TEXT(s)], ...xs]      => binary(_text, s, go(w, k + s.length, xs)),
      [[i, LINE], ...xs]         => binary(_line, i, go(w, i, xs)),
      [[i, UNION(x, y)], ...xs]  => better(w, k,
                                           ternary(go, w, k, [[i, x]] +++ xs),
                                           λ[ternary(go, w, k, [[i, y]] +++ xs)]
                                          )
    }
  }

  // #### function: _text
  // Wraps the Text() constructor for trampolining.
  // @private
  // @type: String, Continuation
  function _text(s, g) {
    if (g instanceof Done) {
      return done(Text(s, g.value))
    } else {
      return binary(_text, s, g.apply())
    }
  }

  // #### function: _line
  // Wraps the Line() constructor for trampolining.
  // @private
  // @type: Int, Continuation
  function _line(i, g) {
    if (g instanceof Done) {
      return done(Line(i, g.value))
    } else {
      return binary(_line, i, g.apply())
    }
  }

  // #### function: go
  // Chooses the best-looking of two styles. @literal("y") is thunked to avoid
  // costly computations.
  // @private
  // @type: Int, Int, Doc, (Unit → Doc) → Doc
  function better(w, k, x, y) {
    if (x instanceof Done) {
      return trampoline(fits(w - k, x.value))? done(x.value) : y()
    } else {
      return nary(better, [w, k, x.apply(), y])
    }
  }

  // #### function: fits
  // Checks if some document fits in the rest of the line.
  // @private
  // @type: Int, Doc → Boolean
  function fits {
    (w, x) if w < 0 => done(false),
    (w, Nil)        => done(true),
    (w, Text(s, x)) => binary(fits, w - s.length, x),
    (w, Line(i, x)) => done(true),
    (w, x) => (function(){ throw new Error("No match: " + show(w) + ", " + show(x)) })()
  }
}

// ### function: layout
// Converts a simple document to a string.
//
// @private
// @type: Doc → String
function layout(doc) {
  return trampoline(go(doc, ""));
  
  function go(x, r) {
    return match x {
      Nil        => done(r),
      Text(s, a) => binary(go, a, r + s),
      Line(i, a) => binary(go, a, r + '\n' + repeat(i, ' '))
    }
  }
}

// ### function: horizontalConcat
// Concatenates two documents horizontally, separated by a single space.
//
// @private
// @type: DOC, DOC → DOC
function horizontalConcat(x, y) {
  return x +++ text(" ") +++ y
}

// ### function: verticalConcat
// Concatenates two documents vertically, separated by a new line.
//
// @private
// @type: DOC, DOC → DOC
function verticalConcat(x, y) {
  return x +++ line() +++ y
}

// ### function: words
// Converts a string into a list of words.
//
// @private
// @type: String → Array(String)
function words(s) {
  return s.split(/\s+/)
}


// -- Primitives -------------------------------------------------------
// Wadler's pretty printer define several primitive functions for working
// with the two aforementioned algebras. Combinators can be easily
// derived from these basic building blocks (and a few area also provided).

// ### function: nil
// Constructs an empty document.
//
// *Example*:
// @code("js"){{{
//   pretty(80, nil()) // => ""
// }}}
//
// @type: Unit → DOC
function nil() {
  return NIL
}

// ### function: concat
// Joins two documents horizontally, without any separation between them.
//
// *Example*:
// @code("js"){{{
//   pretty(80, concat(text('a'), text('b'))) // => "ab"
//   pretty(80, concat(text('a'), nil()))     // => "a"
// }}}
//
// @type: DOC → DOC → DOC
function concat(a, b) {
  return CONCAT(a, b)
}

// ### function: nest
// Indents a document a given amount of spaces.
//
// *Example*:
// @code("js"){{{
//   pretty(80, stack([
//     text('a'),
//     text('b'),
//     text('c')
//   ])
//   // => "a\n    b\n    c"
// }}}
//
// @type: Int → DOC → DOC
function nest(depth, a) {
  return NEST(depth, a)
}

// ### function: text
// Represents plain text in a document.
//
// *Example*:
// @code("js"){{{
//   pretty(80, text("a")) // => "a"
// }}}
//
// @type: String → DOC
function text(s) {
  return TEXT(s)
}

// ### function: line
// Represents a line break in a document.
//
// *Example*:
// @code("js"){{{
//   pretty(80, concat(concat(text("a"), line()), text("b"))
//   // => "a\nb"
// }}}
//
// @type: Unit → DOC
function line() {
  return LINE
}

// ### function: group
// Creates a set of alternative layouts for the document.
//
// *Example*:
// @code("js"){{{
//   pretty(5, group(stack([text('foo'), text('bar')])))
//   // => "foo\nbar"
//
//   pretty(10, group(stack([text('foo'), text('bar')])))
//   // => "foo bar"
// }}}
//
// @type: DOC → DOC
function group(a) {
  return UNION(flatten(a), a)
}

// -- Conversions ------------------------------------------------------
// ### function: pretty
// Returns the best representation of a document for the given amount
// of horizontal space available, as a String.
//
// *Example*:
// @code("js"){{{
//   pretty(80, spread([text('hello'), text('world')]))
//   // => "hello world"
// }}}
//
// @type: Int → DOC → String
function pretty(width, doc) {
  return layout(best(width, 0, doc))
}

// -- Combinators ------------------------------------------------------
// ### function: foldDoc
// Allows folding over pairs of documents (similar to a catamorphism).
// 
// @type: (DOC, DOC → DOC) → Array(DOC) → DOC
function foldDoc {
  (f, [])         => nil(),
  (f, [x])        => x,
  (f, [x, ...xs]) => f(x, foldDoc(f, xs))
}

// ### function: spread
// Lays out a series of documents horizontally, with each document
// separated by a single space.
//
// *Example*:
// @code("js"){{{
//   pretty(80, spread([text('foo'), text('bar')]))
//   // => "foo bar"
// }}}
//
// @type: Array(DOC) → DOC
function spread(xs) {
  return foldDoc(horizontalConcat, xs)
}

// ### function: stack
// Lays out a series of documents vertically, with each document
// separated by a single new line.
//
// *Example*:
// @code("js"){{{
//   pretty(80, stack([text('foo'), text('bar')]))
//   // => "foo\nbar"
// }}}
//
// @type: Array(DOC) → DOC
function stack(xs) {
  return foldDoc(verticalConcat, xs)
}

// ### function: bracket
//
// *Example*:
// @code("js"){{{
//   pretty(5, bracket(2, '[', stack([
//     text('a'), text('b'), text('c')
//   ]), ']'))
//   // => "[\n  a\n  b\n  c \n]"
// }}}
//
// @type: Int → DOC → DOC → DOC → DOC
function bracket(indent, left, x, right) {
  return group(text(left)
           +++ nest(indent, line() +++ x)
           +++ line()
           +++ text(right))
}

// ### function: join
// Joins two documents together, either by separating with a single
// horizontal space or a single new line.
//
// @type: DOC → DOC → DOC
function join(x, y) {
  return x +++ UNION(text(" "), line()) +++ y
}

// ### function: fillWords
// Makes the best use of the available space for laying out words,
// either separated by a space or a new line.
//
// @type: String → DOC
function fillWords(s) {
  return foldDoc(join, words(s).map(text))
}

// ### function: fill
// Makes the best use of the available space for layout out a series
// of documents, either separated by a space or a new line.
//
// @type: Array(DOC) → DOC
function fill {
  []            => nil(),
  [x]           => x,
  [x, y, ...zs] => UNION(horizontalConcat(flatten(x), fill([flatten(y)] +++ zs)),
                         verticalConcat(x, fill([y] +++ zs)))
}


// -- Exports ----------------------------------------------------------
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
