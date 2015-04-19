text.pretty-printing
====================

[![Build status](https://img.shields.io/travis/folktale/text.pretty-printing/master.svg?style=flat-square)](https://travis-ci.org/folktale/text.pretty-printing)[![NPM version](https://img.shields.io/npm/v/text.pretty-printing.svg?style=flat-square)](https://npmjs.org/package/text.pretty-printing)[![Dependencies status](https://img.shields.io/david/folktale/text.pretty-printing.svg?style=flat-square)](https://david-dm.org/folktale/text.pretty-printing)![Licence](https://img.shields.io/npm/l/text.pretty-printing.svg?style=flat-square&label=licence)![Stable](https://img.shields.io/badge/stability-experimental-green.svg?style=flat-square)


An implementation of Wadler's Pretty Printer; an efficient algebra that
supports multiple layouts, choosing the best one for the available screen
space.


## Example

```js
var { pretty, text, bracket } = require('text.pretty-printing');
var { Extractor } = require('adt-simple');

// We define a simple binary tree
union Tree {
  Leaf(*),
  Branch(Tree, Tree)
} deriving (Extractor)

// And a toString method that returns the prettified document
Tree::toString = function(width, indent) {
  return pretty(width, this.toDoc(indent))
}

// Transforming a tree into a document is just regular structural
// recursion. Here `a +++ b` is shorthand for `a.concat(b)`.
Tree::toDoc = function(i) {
  return match this {
    Leaf(v)      =>
      text('Leaf(') +++ text(v.toString()) +++ text(')'),

    Branch(l, r) =>
      bracket(i, 'Branch(', l.toDoc(i) +++ text(', ') +++ r.toDoc(i), ')')
  }
}

var tree = new Branch(
  new Branch(new Leaf(1), new Branch(new Leaf(2), new Leaf(3))),
  new Leaf(4)
)

console.log(tree.toString(30, 4))
// => "Branch(
//        Branch(
//            Leaf(1), Branch(
//                Leaf(2), Leaf(3)
//            )
//        ), Leaf(4)
//    )"

console.log(tree.toString(80, 4))
// => "Branch( Branch( Leaf(1), Branch( Leaf(2), Leaf(3) ) ), Leaf(4) )"
```

See the `examples/` folder for additional examples.


## Installing

The easiest way is to grab it from NPM. If you're running in a Browser
environment, you can use [Browserify][]

    $ npm install text.pretty-printing


### Using with CommonJS

If you're not using NPM, [Download the latest release][release], and require
the `text.pretty-printing.umd.js` file:

```js
var PrettyPrinter = require('text.pretty-printing')
```


### Using with AMD

[Download the latest release][release], and require the `text.pretty-printing.umd.js`
file:

```js
require(['text.pretty-printing'], function(PrettyPrinter) {
  ( ... )
})
```


### Using without modules

[Download the latest release][release], and load the `text.pretty-printing.umd.js`
file. The properties are exposed in the global `Folktale.Text.PrettyPrinting` object:

```html
<script src="/path/to/text.pretty-printing.umd.js"></script>
```


### Compiling from source

If you want to compile this library from the source, you'll need [Git][],
[Make][], [Node.js][], and run the following commands:

    $ git clone git://github.com/folktale/text.pretty-printing.git
    $ cd text.pretty-printing
    $ npm install
    $ make bundle
    
This will generate the `dist/text.pretty-printing.umd.js` file, which you can load in
any JavaScript environment.

    
## Documentation

You can [read the documentation online][docs] or build it yourself:

    $ git clone git://github.com/folktale/text.pretty-printing.git
    $ cd text.pretty-printing
    $ npm install
    $ make documentation

Then open the file `docs.md`.


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :)


## Licence

Copyright (c) 2015 Quildreen Motta.

Released under the [MIT licence](https://github.com/folktale/text.pretty-printing/blob/master/LICENCE).

<!-- links -->
[Fantasy Land]: https://github.com/fantasyland/fantasy-land
[Browserify]: http://browserify.org/
[Git]: http://git-scm.com/
[Make]: http://www.gnu.org/software/make/
[Node.js]: http://nodejs.org/
[es5-shim]: https://github.com/kriskowal/es5-shim
[docs]: https://github.com/folktale/text.pretty-printing/blob/master/docs.md
<!-- [release: https://github.com/folktale/text.pretty-printing/releases/download/v$VERSION/text.pretty-printing-$VERSION.tar.gz] -->
[release]: https://github.com/folktale/text.pretty-printing/releases/download/v1.0.0/text.pretty-printing-1.0.0.tar.gz
<!-- [/release] -->
