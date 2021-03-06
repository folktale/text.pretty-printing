.. This file is auto-generated from Dollphie.




Module: ``Text.PrettyPrinting``
*******************************




.. module:: Text.PrettyPrinting
   :synopsis:
     Compositional pretty printer supporting multiple layouts.
   :platform:
     ECMAScript 5
   
   
   


:Stability:
  stable
:Portability:
  Portable




This module is an implementation of Wadler's `Pretty Printer`_.
As described in the paper, the pretty printer is an efficient
algebra that supports multiple adaptable layouts according to the
available space.



.. _`Pretty Printer`: http://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf





Dependencies
============



.. code-block:: js
   
   
   var { Base }  = require('adt-simple');
   var { curry } = require('core.lambda');
   var { Done, trampoline, done, ternary, binary, nary } = require('./tramp')
   






Data structures
===============

The pretty printer uses two algebras:


The simple pretty printer is an algebra for documents that
represents them as a concatenation of items. Each item may be one
of the following:


.. code-block:: js
   
   
   union Doc {
     Nil,                  // Nothing, used as identity;
     Text(String, Doc),    // Some text;
     Line(Number, Doc)     // A line break, indented by a given amount;
   } deriving (Base)
   




To allow (efficient) alternative layouts, a different algebra
for documents is used, where we see things as a set of possible
layouts for the same document.


In this version we have more tags, since we add explicit representations
for concatenation and nesting, and make some internal assumptions
for the sake efficiency. These assumptions must be preserved whenever
documents are built, and to enforce that, users are not given these
structures to work with directly.


.. code-block:: js
   
   
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
   
   






Helpers
=======

.. rst-class:: hidden-heading




Repeat()
--------




.. function:: Repeat()
   
   
   
   
   .. code-block:: haskell
      
      
      Int, String → String
   
   
   
   
   
   
   
   Returns a String with `s` repeated `n` times.
   
   
   
   
   
   .. code-block:: js
      
      
      function repeat(n, s) {
        return Array(n + 1).join(s)
      }
      
   
   
   
   


.. rst-class:: hidden-heading




flatten()
---------




.. function:: flatten()
   
   
   
   
   .. code-block:: haskell
      
      
      DOC → DOC
   
   
   
   
   
   
   
   Flatten replaces line breaks in a set of layouts by a single
   whitespace. It's defined privately so the invariants may hold.
   
   
   
   
   
   .. code-block:: js
      
      
      function flatten {
        NIL            => NIL,
        CONCAT(a, b)   => CONCAT(flatten(a), flatten(b)),
        NEST(depth, a) => NEST(depth, flatten(a)),
        TEXT(s)        => TEXT(s),
        LINE           => TEXT(" "),
        UNION(a, b)    => flatten(a),
        a              => (function(){ throw new Error("No match: " + a) })();
      }
      
   
   
   
   


.. rst-class:: hidden-heading




best()
------




.. function:: best()
   
   
   
   
   .. code-block:: haskell
      
      
      Int, Int, DOC → DOC
   
   
   
   
   
   
   
   Best chooses the best-looking alternative from a set of possible
   layouts a document may have. It takes into account the available
   layout for the rest of the document when doing so.
   
   
   
   
   
   .. code-block:: js
      
      
      function best(width, indentation, doc) {
        return trampoline(go(width, indentation, [[0, doc]]));
      
   
   
   
   
   .. rst-class:: hidden-heading
   
   
   
   
   .. rubric:: go()
   
   
   
   
   .. function:: go()
      
      
      
      
      .. code-block:: haskell
         
         
         Int, Int, (Int, DOC) → Doc
      
      
      
      
      
      
      
      
      
      
      .. code-block:: js
         
         
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
         
      
      
      
      
   
   
   .. rst-class:: hidden-heading
   
   
   
   
   .. rubric:: _text()
   
   
   
   
   .. function:: _text()
      
      
      
      
      .. code-block:: haskell
         
         
         String, Continuation
      
      
      
      
      
      
      
      Wraps the Text() constructor for trampolining.
      
      
      
      .. code-block:: js
         
         
           function _text(s, g) {
             if (g instanceof Done) {
               return done(Text(s, g.value))
             } else {
               return binary(_text, s, g.apply())
             }
           }
         
      
      
      
      
   
   
   .. rst-class:: hidden-heading
   
   
   
   
   .. rubric:: _line()
   
   
   
   
   .. function:: _line()
      
      
      
      
      .. code-block:: haskell
         
         
         Int, Continuation
      
      
      
      
      
      
      
      Wraps the Line() constructor for trampolining.
      
      
      
      .. code-block:: js
         
         
           function _line(i, g) {
             if (g instanceof Done) {
               return done(Line(i, g.value))
             } else {
               return binary(_line, i, g.apply())
             }
           }
         
      
      
      
      
   
   
   .. rst-class:: hidden-heading
   
   
   
   
   .. rubric:: go()
   
   
   
   
   .. function:: go()
      
      
      
      
      .. code-block:: haskell
         
         
         Int, Int, Doc, (Unit → Doc) → Doc
      
      
      
      
      
      
      
      Chooses the best-looking of two styles. ``y`` is thunked to avoid
      costly computations.
      
      
      
      .. code-block:: js
         
         
           function better(w, k, x, y) {
             if (x instanceof Done) {
               return fits(w - k, x.value)? done(x.value) : y()
             } else {
               return nary(better, [w, k, x.apply(), y])
             }
           }
         
      
      
      
      
   
   
   .. rst-class:: hidden-heading
   
   
   
   
   .. rubric:: fits()
   
   
   
   
   .. function:: fits()
      
      
      
      
      .. code-block:: haskell
         
         
         Int, Doc → Boolean
      
      
      
      
      
      
      
      Checks if some document fits in the rest of the line.
      
      
      
      .. code-block:: js
         
         
           function fits {
             (w, x) if w < 0 => false,
             (w, Nil)        => true,
             (w, Text(s, x)) => fits(w - s.length, x),
             (w, Line(i, x)) => true,
             (w, x) => (function(){ throw new Error("No match: " + show(w) + ", " + show(x)) })()
           }
         }
         
      
      
      
      
   
   


.. rst-class:: hidden-heading




layout()
--------




.. function:: layout()
   
   
   
   
   .. code-block:: haskell
      
      
      Doc → String
   
   
   
   
   
   
   
   Converts a simple document to a string.
   
   
   
   
   
   .. code-block:: js
      
      
      function layout {
        Nil        => "",
        Text(s, a) => s + layout(a),
        Line(i, a) => '\n' + repeat(i, ' ') + layout(a)
      }
      
   
   
   
   


.. rst-class:: hidden-heading




horizontalConcat()
------------------




.. function:: horizontalConcat()
   
   
   
   
   .. code-block:: haskell
      
      
      DOC, DOC → DOC
   
   
   
   
   
   
   
   Concatenates two documents horizontally, separated by a single space.
   
   
   
   
   
   .. code-block:: js
      
      
      function horizontalConcat(x, y) {
        return x +++ text(" ") +++ y
      }
      
   
   
   
   


.. rst-class:: hidden-heading




verticalConcat()
----------------




.. function:: verticalConcat()
   
   
   
   
   .. code-block:: haskell
      
      
      DOC, DOC → DOC
   
   
   
   
   
   
   
   Concatenates two documents vertically, separated by a new line.
   
   
   
   
   
   .. code-block:: js
      
      
      function verticalConcat(x, y) {
        return x +++ line() +++ y
      }
      
   
   
   
   


.. rst-class:: hidden-heading




words()
-------




.. function:: words()
   
   
   
   
   .. code-block:: haskell
      
      
      String → Array(String)
   
   
   
   
   
   
   
   Converts a string into a list of words.
   
   
   
   
   
   .. code-block:: js
      
      
      function words(s) {
        return s.split(/\s+/)
      }
      
      
   
   
   
   




Primitives
==========

Wadler's pretty printer define several primitive functions for working
with the two aforementioned algebras. Combinators can be easily
derived from these basic building blocks (and a few area also provided).


.. rst-class:: hidden-heading




nil()
-----




.. function:: nil()
   
   
   
   
   .. code-block:: haskell
      
      
      Unit → DOC
   
   
   
   
   
   
   
   Constructs an empty document.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, nil()) // => ""
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function nil() {
        return NIL
      }
      
   
   
   
   


.. rst-class:: hidden-heading




concat()
--------




.. function:: concat()
   
   
   
   
   .. code-block:: haskell
      
      
      DOC → DOC → DOC
   
   
   
   
   
   
   
   Joins two documents horizontally, without any separation between them.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, concat(text('a'), text('b'))) // => "ab"
        pretty(80, concat(text('a'), nil()))     // => "a"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function concat(a, b) {
        return CONCAT(a, b)
      }
      
   
   
   
   


.. rst-class:: hidden-heading




nest()
------




.. function:: nest()
   
   
   
   
   .. code-block:: haskell
      
      
      Int → DOC → DOC
   
   
   
   
   
   
   
   Indents a document a given amount of spaces.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, stack([
          text('a'),
          text('b'),
          text('c')
        ])
        // => "a\n    b\n    c"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function nest(depth, a) {
        return NEST(depth, a)
      }
      
   
   
   
   


.. rst-class:: hidden-heading




text()
------




.. function:: text()
   
   
   
   
   .. code-block:: haskell
      
      
      String → DOC
   
   
   
   
   
   
   
   Represents plain text in a document.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, text("a")) // => "a"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function text(s) {
        return TEXT(s)
      }
      
   
   
   
   


.. rst-class:: hidden-heading




line()
------




.. function:: line()
   
   
   
   
   .. code-block:: haskell
      
      
      Unit → DOC
   
   
   
   
   
   
   
   Represents a line break in a document.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, concat(concat(text("a"), line()), text("b"))
        // => "a\nb"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function line() {
        return LINE
      }
      
   
   
   
   


.. rst-class:: hidden-heading




group()
-------




.. function:: group()
   
   
   
   
   .. code-block:: haskell
      
      
      DOC → DOC
   
   
   
   
   
   
   
   Creates a set of alternative layouts for the document.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(5, group(stack([text('foo'), text('bar')])))
        // => "foo\nbar"
      
        pretty(10, group(stack([text('foo'), text('bar')])))
        // => "foo bar"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function group(a) {
        return UNION(flatten(a), a)
      }
      
   
   
   
   




Conversions
===========

.. rst-class:: hidden-heading




pretty()
--------




.. function:: pretty()
   
   
   
   
   .. code-block:: haskell
      
      
      Int → DOC → String
   
   
   
   
   
   
   
   Returns the best representation of a document for the given amount
   of horizontal space available, as a String.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, spread([text('hello'), text('world')]))
        // => "hello world"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function pretty(width, doc) {
        return layout(best(width, 0, doc))
      }
      
   
   
   
   




Combinators
===========

.. rst-class:: hidden-heading




foldDoc()
---------




.. function:: foldDoc()
   
   
   
   
   .. code-block:: haskell
      
      
      (DOC, DOC → DOC) → Array(DOC) → DOC
   
   
   
   
   
   
   
   Allows folding over pairs of documents (similar to a catamorphism).
   
   
   
   
   .. code-block:: js
      
      
      function foldDoc {
        (f, [])         => nil(),
        (f, [x])        => x,
        (f, [x, ...xs]) => f(x, foldDoc(f, xs))
      }
      
   
   
   
   


.. rst-class:: hidden-heading




spread()
--------




.. function:: spread()
   
   
   
   
   .. code-block:: haskell
      
      
      Array(DOC) → DOC
   
   
   
   
   
   
   
   Lays out a series of documents horizontally, with each document
   separated by a single space.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, spread([text('foo'), text('bar')]))
        // => "foo bar"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function spread(xs) {
        return foldDoc(horizontalConcat, xs)
      }
      
   
   
   
   


.. rst-class:: hidden-heading




stack()
-------




.. function:: stack()
   
   
   
   
   .. code-block:: haskell
      
      
      Array(DOC) → DOC
   
   
   
   
   
   
   
   Lays out a series of documents vertically, with each document
   separated by a single new line.
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(80, stack([text('foo'), text('bar')]))
        // => "foo\nbar"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function stack(xs) {
        return foldDoc(verticalConcat, xs)
      }
      
   
   
   
   


.. rst-class:: hidden-heading




bracket()
---------




.. function:: bracket()
   
   
   
   
   .. code-block:: haskell
      
      
      Int → DOC → DOC → DOC → DOC
   
   
   
   
   
   
   
   **Example**:
   
   
   .. code-block:: js
      
      
      
        pretty(5, bracket(2, '[', stack([
          text('a'), text('b'), text('c')
        ]), ']'))
        // => "[\n  a\n  b\n  c \n]"
      
   
   
   
   
   
   
   .. code-block:: js
      
      
      function bracket(indent, left, x, right) {
        return group(text(left)
                 +++ nest(indent, line() +++ x)
                 +++ line()
                 +++ text(right))
      }
      
   
   
   
   


.. rst-class:: hidden-heading




join()
------




.. function:: join()
   
   
   
   
   .. code-block:: haskell
      
      
      DOC → DOC → DOC
   
   
   
   
   
   
   
   Joins two documents together, either by separating with a single
   horizontal space or a single new line.
   
   
   
   
   .. code-block:: js
      
      
      function join(x, y) {
        return x +++ UNION(text(" "), line()) +++ y
      }
      
   
   
   
   


.. rst-class:: hidden-heading




fillWords()
-----------




.. function:: fillWords()
   
   
   
   
   .. code-block:: haskell
      
      
      String → DOC
   
   
   
   
   
   
   
   Makes the best use of the available space for laying out words,
   either separated by a space or a new line.
   
   
   
   
   .. code-block:: js
      
      
      function fillWords(s) {
        return foldDoc(join, words(s).map(text))
      }
      
   
   
   
   


.. rst-class:: hidden-heading




fill()
------




.. function:: fill()
   
   
   
   
   .. code-block:: haskell
      
      
      Array(DOC) → DOC
   
   
   
   
   
   
   
   Makes the best use of the available space for layout out a series
   of documents, either separated by a space or a new line.
   
   
   
   
   .. code-block:: js
      
      
      function fill {
        []            => nil(),
        [x]           => x,
        [x, y, ...zs] => UNION(horizontalConcat(flatten(x), fill([flatten(y)] +++ zs)),
                               verticalConcat(x, fill([y] +++ zs)))
      }
      
      
   
   
   
   




Exports
=======



.. code-block:: js
   
   
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
   




