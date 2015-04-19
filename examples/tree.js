var __ref = require('../');
var pretty = __ref.pretty;
var text = __ref.text;
var bracket = __ref.bracket;
var __ref$2 = require('adt-simple');
var Extractor = __ref$2.Extractor;
var Tree = function () {
        function Tree$2() {
        }
        function Leaf$2(_0) {
            if (!(this instanceof Leaf$2)) {
                return new Leaf$2(_0);
            }
            this['0'] = _0;
        }
        Leaf$2.prototype = new Tree$2();
        Leaf$2.prototype.constructor = Leaf$2;
        Leaf$2.prototype.length = 1;
        function Branch$2(_0, _1) {
            if (!(this instanceof Branch$2)) {
                return new Branch$2(_0, _1);
            }
            if (_0 instanceof Tree) {
                this['0'] = _0;
            } else {
                throw new TypeError('Unexpected type for field: Tree.Branch.0');
            }
            if (_1 instanceof Tree) {
                this['1'] = _1;
            } else {
                throw new TypeError('Unexpected type for field: Tree.Branch.1');
            }
        }
        Branch$2.prototype = new Tree$2();
        Branch$2.prototype.constructor = Branch$2;
        Branch$2.prototype.length = 2;
        var derived = Extractor.derive({
                name: 'Tree',
                constructor: Tree$2,
                prototype: Tree$2.prototype,
                variants: [
                    {
                        name: 'Leaf',
                        constructor: Leaf$2,
                        prototype: Leaf$2.prototype,
                        fields: ['0']
                    },
                    {
                        name: 'Branch',
                        constructor: Branch$2,
                        prototype: Branch$2.prototype,
                        fields: [
                            '0',
                            '1'
                        ]
                    }
                ]
            });
        Tree$2.Leaf = derived.variants[0].constructor;
        Tree$2.Branch = derived.variants[1].constructor;
        return Tree$2;
    }();
var Leaf = Tree.Leaf;
var Branch = Tree.Branch;
Tree.prototype.toString = function (width, indent) {
    return pretty(width, this.toDoc(indent));
};
Tree.prototype.toDoc = function (i) {
    return function (a0) {
        var r0 = Leaf.unapply(a0);
        if (r0 != null && r0.length === 1) {
            var v = r0[0];
            return text('Leaf(').concat(text(v.toString())).concat(text(')'));
        }
        var r1 = Branch.unapply(a0);
        if (r1 != null && r1.length === 2) {
            var l = r1[0];
            var r = r1[1];
            return bracket(i, 'Branch(', l.toDoc(i).concat(text(', ')).concat(r.toDoc(i)), ')');
        }
        throw new TypeError('No match');
    }.call(this, this);
};
var tree = new Branch(new Branch(new Leaf(1), new Branch(new Leaf(2), new Leaf(3))), new Leaf(4));
module.exports = {
    Tree: Tree,
    tree: tree
};
console.log(tree.toString(30, 2));
//# sourceMappingURL=tree.js.map