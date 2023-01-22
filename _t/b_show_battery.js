#!/usr/bin/env gjs
'use strict';

//import { is_battery_full, battery_status } from './battery.js';

const { GLib, Gio } = imports.gi;

const decoder = new TextDecoder('utf-8');
Gio._promisify(Gio.File.prototype, 'load_contents_async', 'load_contents_finish');

async function _catfile(name, cancel) {
    let f = Gio.File.new_for_path('/sys/class/power_supply/BAT0/' + name);
    let [s, ] = await f.load_contents_async(cancel)
    return decoder.decode(s);
}

async function battery_status(cancel) {
    let s = await _catfile('status', cancel);
    return s.trim();
}

async function is_battery_full(cancel) {
    let s = battery_status(cancel);
    return s == 'Full';
}

const loop = new GLib.MainLoop(null, false);

async function show() {
    try {
        let s = await battery_status(null);
        let flag = await is_battery_full(null);
        print('battery status:', s);
        print('is full:', flag);
    } catch(e) {
        printerr(e);
    }
    loop.quit();
}

const taskId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    show().catch((e) => {
        printerr(e);
    });
    return GLib.SOURCE_REMOVE;
});

const quitId = GLib.timeout_add_seconds(GLib.PRIORITY_LOW, 5, () => {
    loop.quit();
    return GLib.SOURCE_REMOVE;
});

try {
    loop.run();
} catch(e) {
    printerr(e);
}
