'use strict';

const { Gio } = imports.gi;

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
    let s = await battery_status(cancel);
    return s == 'Full';
}

var Battery = {
    battery_status: battery_status,
    is_battery_full: is_battery_full
};
