'use strict';

const { Gio, UPowerGlib } = imports.gi;

const decoder = new TextDecoder('utf-8');
Gio._promisify(Gio.File.prototype, 'load_contents_async', 'load_contents_finish');

function _upowerglib_client_async(cancel) {
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

class Client {
    constructor(cancel) {
        this._cancel = cancel;
        this._ready = false;
        this._onchange = null;
        this._client = null;
        this._err = null;

        _upowerglib_client_async(cancel)
        .then(c => {
            c.conncet('device-added', _ => { this._change(); });
            c.conncet('device-removed', _ => { this._change(); });
            this._client = c;
            this._ready = true;
            this._change();
        }).catch(e => {
            this._err = e;
            this._change();
        });
    }

    status() {
        if (!this._ready) {
            return 'Unknown';
        }
        let s = this._client.get_display_device().state;
        if (s == UPowerGlib.DeviceState.FULLY_CHARGED) {
            return 'Full';
        } else if (s == UPowerGlib.DeviceState.CHARGING) {
            return 'Charging';
        } else if (s == UPowerGlib.DeviceState.DISCHARGING) {
            return 'Discharging';
        }
        return UPowerGlib.Device.state_to_string(s);
    }

    err() {
        return this._err;
    }

    onchange(cb) {
        this._onchange = cb;
    }

    _change() {
        if (this._onchange) this._onchange();
    }
}

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
