#!/usr/bin/env gjs
'use strict';

imports.gi.versions.Gtk = "3.0";
const { Gtk, GLib, Gio } = imports.gi;

const app = Gtk.Application.new(
    'xyz.lintd233.gjs-test.overcharge_alarm.test_notify',
    Gio.ApplicationFlags.FLAGS_NONE
);

const quitId = GLib.timeout_add_seconds(GLib.PRIORITY_LOW, 10, () => {
    app.quit();
    return GLib.SOURCE_REMOVE;
});

let _cnt = 0;
const cntId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
    print(++_cnt);
    return GLib.SOURCE_CONTINUE;
});

const taskId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT_IDLE, 3, () => {
    try {
        let n = Gio.Notification.new('过充提醒');
        n.set_body('battery overcharged!');
        n.set_priority(Gio.NotificationPriority.URGENT);
        app.send_notification('overcharged', n);
        print('ok sent notification');
    } catch (e) {
        printerr(e);
    }
    return GLib.SOURCE_REMOVE;
});

app.connect('activate', ap => {
    let w = ap.activeWindow;
    if (!w) {
        w = new Gtk.ApplicationWindow({
            application: ap,
            defaultHeight: 600,
            defaultWidth: 800
        });
    }
    print('app activate');
    ap.register(null);
    print('register called');
    w.present();
});

app.run(null);
