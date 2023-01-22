#!/usr/bin/env gjs
'use strict';

imports.gi.versions.Gtk = "3.0";
const { Gtk } = imports.gi;

Gtk.init(null);

/* create a widget to demonstrate */

let win = new Gtk.Window();
//win.add(/* widget */);
win.show_all();

Gtk.main();
