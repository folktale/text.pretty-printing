// # module: Text.PrettyPrinting.Tramp
//
// Trampoline utilities.

// -- Dependencies -----------------------------------------------------
var { Base } = require('adt-simple');


// -- Data structures --------------------------------------------------
// Continuation(Function, ...args)
union Continuation {
  Thunk(*),
  Unary(*, *),
  Binary(*, *, *),
  Ternary(*, *, *, *),
  NAry(*, *)
} deriving (Base)

Thunk::apply = function() {
  return this['0']()
};

Unary::apply = function() {
  return this['0'](this['1'])
}

Binary::apply = function() {
  console.log(s(this['1']), s(this['2'].toString()));
  return this['0'](this['1'], this['2'])
}

Ternary::apply = function() {
  return this['0'](this['1'], this['2'], this['3'])
}

NAry::apply = function() {
  return this['0'].apply(null, this['1'])
}


union Trampoline {
  Continue { fn: Continuation },
  Done { value: * }
} deriving (Base)


function trampoline(x) {
  while(x instanceof Continue) {
    x = x.fn.apply();
  }
  return x.value
}

function thunk(f){
  return new Continue(new Thunk(f))
}
function unary(f, a) {
  return new Continue(new Unary(f, a))
}
function binary(f, a, b) {
  return new Continue(new Binary(f, a, b))
}
function ternary(f, a, b, c) {
  return new Continue(new Ternary(f, a, b, c))
}
function nary(f, xs) {
  return new Continue(new NAry(f, xs))
}
function done(v) {
  return new Done(v)
}

module.exports = {
  trampoline: trampoline,
  thunk: thunk,
  unary: unary,
  binary: binary,
  ternary: ternary,
  nary: nary,
  done: done
}
