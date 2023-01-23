#!/usr/bin/env gjs
'use strict';

const { GLib } = imports.gi;

const loop = new GLib.MainLoop(null, false);

const quitId = GLib.timeout_add_seconds(GLib.PRIORITY_LOW, 10, () => {
    loop.quit();
    return GLib.SOURCE_REMOVE;
});

let _cnt = 0;
const cntId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
    print(++_cnt);
    return GLib.SOURCE_CONTINUE;
});

const taskId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    GLib.spawn_command_line_async('aplay test.wav');
    return GLib.SOURCE_REMOVE;
});

loop.run();
