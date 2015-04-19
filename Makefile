bin        = $(shell npm bin)
sjs        = $(bin)/sjs
browserify = $(bin)/browserify
dollphie   = $(bin)/dollphie
uglify     = $(bin)/uglifyjs
VERSION    = $(shell node -e 'console.log(require("./package.json").version)')

# -- Configuration -----------------------------------------------------
PACKAGE  = text.pretty-printing
EXPORTS  = Folktale.Text.PrettyPrinting

LIB_DIR  = lib
SRC_DIR  = src
SRC      = $(wildcard $(SRC_DIR)/*.sjs)
TGT      = ${SRC:$(SRC_DIR)/%.sjs=$(LIB_DIR)/%.js}

EX_DIR = examples
EX_BLD = examples
EX_SRC = $(wildcard $(EX_DIR)/*.sjs)
EX_TGT = ${EX_SRC:$(EX_DIR)/%.sjs=$(EX_BLD)/%.js}

TEST_DIR = test/specs-src
TEST_BLD = test/specs
TEST_SRC = $(wildcard $(TEST_DIR)/*.sjs)
TEST_TGT = ${TEST_SRC:$(TEST_DIR)/%.sjs=$(TEST_BLD)/%.js}


# -- Compilation -------------------------------------------------------
dist:
	mkdir -p $@

dist/$(PACKAGE).umd.js: $(LIB_DIR)/index.js dist
	$(browserify) $< --standalone $(EXPORTS) > $@

dist/$(PACKAGE).umd.min.js: dist/$(PACKAGE).umd.js
	$(uglify) --mangle - < $< > $@

$(LIB_DIR)/%.js: $(SRC_DIR)/%.sjs
	mkdir -p $(dir $@)
	$(sjs) --readable-names \
	       --sourcemap      \
	       --module lambda-chop/macros \
	       --module adt-simple/macros \
	       --module sparkler/macros \
	       --module es6-macros/macros/destructure \
	       --module macros.operators \
	       --output $@      \
	       $<

$(EX_BLD)/%.js: $(EX_DIR)/%.sjs
	mkdir -p $(dir $@)
	$(sjs) --readable-names \
	       --sourcemap      \
	       --module lambda-chop/macros \
	       --module adt-simple/macros \
	       --module sparkler/macros \
	       --module es6-macros/macros/destructure \
	       --module macros.operators \
	       --output $@      \
	       $<

$(TEST_BLD)/%.js: $(TEST_DIR)/%.sjs
	mkdir -p $(dir $@)
	$(sjs) --readable-names        \
	       --module specify-core/macros  \
	       --module alright/macros \
	       --output $@             \
	       $<


# -- Tasks -------------------------------------------------------------
source: $(TGT)
examples: $(EX_TGT)

all: source examples

bundle: dist/$(PACKAGE).umd.js

minify: dist/$(PACKAGE).umd.min.js

documentation:
	$(dollphie) --input javascript --output markdown src/index.sjs > docs.md

clean:
	rm -rf dist build $(LIB_DIR)

test: all $(TEST_TGT)
	node test/run.js

package: documentation bundle minify
	mkdir -p dist/$(PACKAGE)-$(VERSION)
	cp -r docs dist/$(PACKAGE)-$(VERSION)
	cp -r lib dist/$(PACKAGE)-$(VERSION)
	cp dist/*.js dist/$(PACKAGE)-$(VERSION)
	cp package.json dist/$(PACKAGE)-$(VERSION)
	cp README.md dist/$(PACKAGE)-$(VERSION)
	cp LICENCE dist/$(PACKAGE)-$(VERSION)
	cd dist && tar -czf $(PACKAGE)-$(VERSION).tar.gz $(PACKAGE)-$(VERSION)

publish: clean test
	npm install
	npm publish

bump:
	node tools/bump-version.js $$VERSION_BUMP

bump-feature:
	VERSION_BUMP=FEATURE $(MAKE) bump

bump-major:
	VERSION_BUMP=MAJOR $(MAKE) bump

.PHONY: test bump bump-feature bump-major publish package clean documentation
