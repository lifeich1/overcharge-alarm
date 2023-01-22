#!/usr/bin/env gjs
'use strict';

imports.searchPath.push('.');
const { GLib, Gio } = imports.gi;
const { Battery } = imports.battery;

const decoder = new TextDecoder('utf-8');
Gio._promisify(Gio.File.prototype, 'load_contents_async', 'load_contents_finish');

const loop = new GLib.MainLoop(null, false);

async function show() {
    try {
        let s = await Battery.battery_status(null);
        let flag = await Battery.is_battery_full(null);
        print('battery status:', s);
        print('is full:', flag);
    } catch(e) {
        printerr(e);
    }
    loop.quit();
}

const taskId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    show().catch(printerr);
    return GLib.SOURCE_REMOVE;
});

loop.run();
