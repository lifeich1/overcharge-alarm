D := $(HOME)/.local/share/gnome-shell/extensions
U := overcharge_alarm@lifeich1.github.io

S := extension.js \
	 metadata.json \
	 stylesheet.css \
	 mods/battery.js

SFILE := $(patsubst %,$(U)/%,$(S))
DFILE := $(patsubst %,$(D)/%,$(SFILE))
DDIR := $(D)/$(U) $(D)/$(U)/mods

.PHONY: all
all: $(DFILE)

$(DFILE): $(DDIR)
$(DFILE): $(D)/%: %
	cp -a $< $@

$(DDIR):
	mkdir -p $@

PL_GEA := enable disable reset
.PHONY: $(PL_GEA)
$(PL_GEA):
	gnome-extensions $@ $(U)

.PHONY: dbg
dbg:
	dbus-run-session -- gnome-shell --nested --wayland >shell.log 2>shell.err
