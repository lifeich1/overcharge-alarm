#!/usr/bin/env gjs
'use strict';

const { GLib, Gio, UPowerGlib } = imports.gi;

function upowerglib_client_async(cancel) {
    return new Promise((resolve, reject) => {
        UPowerGlib.Client.new_async(cancel, (_, res) => {
            try {
                resolve(UPowerGlib.Client.new_finish(res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

const loop = new GLib.MainLoop(null, false);

const quitId = GLib.timeout_add_seconds(GLib.PRIORITY_LOW, 10, () => {
    loop.quit();
    return GLib.SOURCE_REMOVE;
});

upowerglib_client_async(null)
    .then(c => {
        print('get client');
        print('on-battery', c.get_on_battery());
        let d = c.get_display_device();
        print('dev stat', d.state, UPowerGlib.Device.state_to_string(d.state));
        c.connect('device-added', dev => {
            let d = c.get_display_device();
            print('daev; dev stat', d.state, UPowerGlib.Device.state_to_string(d.state));
        });
        c.connect('device-removed', p => {
            let d = c.get_display_device();
            print('drev; dev stat', d.state, UPowerGlib.Device.state_to_string(d.state));
        });
    })
    .catch(e => {
        printerr('error new client:', e);
    });

loop.run();
