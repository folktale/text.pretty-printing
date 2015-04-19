// # module: Text.PrettyPrinting.Tramp
//
// Trampoline utilities.

// -- Data structures --------------------------------------------------
function Continuation() {}

Thunk.prototype = Object.create(Continuation.prototype);
function Thunk(fn){
  this.fn = fn
}
Thunk::apply = function() {
  return this.fn()
}

Unary.prototype = Object.create(Continuation.prototype);
function Unary(fn, a) {
  this.fn = fn;
  this.a  = a;
}
Unary::apply = function() {
  return this.fn(this.a)
}

Binary.prototype = Object.create(Continuation.prototype);
function Binary(fn, a, b) {
  this.fn = fn;
  this.a  = a;
  this.b  = b;
}
Binary::apply = function() {
  return this.fn(this.a, this.b)
}

Ternary.prototype = Object.create(Continuation.prototype);
function Ternary(fn, a, b, c) {
  this.fn = fn;
  this.a  = a;
  this.b  = b;
  this.c  = c;
}
Ternary::apply = function() {
  return this.fn(this.a, this.b, this.c)
}

NAry.prototype = Object.create(Continuation.prototype);
function NAry(fn, xs) {
  this.fn = fn;
  this.xs = xs;
}
NAry::apply = function() {
  return this.fn.apply(null, this.xs)
}

function Done(value) {
  this.value = value;
}

function trampoline(x) {
  while(x instanceof Continuation) {
    x = x.apply();
  }
  return x.value
}

function thunk(f){
  return new Thunk(f)
}
function unary(f, a) {
  return new Unary(f, a)
}
function binary(f, a, b) {
  return new Binary(f, a, b)
}
function ternary(f, a, b, c) {
  return new Ternary(f, a, b, c)
}
function nary(f, xs) {
  return new NAry(f, xs)
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
  done: done,
  Done: Done
}
