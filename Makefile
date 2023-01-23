D := $(HOME)/.local/share/gnome-shell/extensions
U := overcharge_alarm@lifeich1.github.io

S := extension.js \
	 metadata.json \
	 stylesheet.css

SFILE := $(patsubst %,$(U)/%,$(S))
DFILE := $(patsubst %,$(D)/%,$(SFILE))
DDIR := $(D)/$(U)

.PHONY: all
all: $(DFILE)

$(DFILE): $(DDIR)
$(DFILE): $(D)/%: %
	cp -a $< $@

$(DDIR):
	mkdir -p $@

PL_GEA := enable disable
.PHONY: $(PL_GEA)
$(PL_GEA):
	gnome-extensions $@ $(U)
