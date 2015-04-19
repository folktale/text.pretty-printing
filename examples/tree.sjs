var { pretty, text, bracket } = require('../');
var { Extractor } = require('adt-simple');

union Tree {
  Leaf(*),
  Branch(Tree, Tree)
} deriving (Extractor)

Tree::toString = function(width, indent) {
  return pretty(width, this.toDoc(indent))
}

Tree::toDoc = function(i) {
  return match this {
    Leaf(v)      => text('Leaf(') +++ text(v.toString()) +++ text(')'),
    Branch(l, r) => bracket(i, 'Branch(', l.toDoc(i) +++ text(', ') +++ r.toDoc(i), ')')
  }
}

var tree = new Branch(
  new Branch(new Leaf(1), new Branch(new Leaf(2), new Leaf(3))),
  new Leaf(4)
)

console.log('With width = 30');
console.log(tree.toString(30, 2))

console.log('With width = 80');
console.log(tree.toString(80, 2))

module.exports = {
  Tree: Tree,
  tree: tree
}
