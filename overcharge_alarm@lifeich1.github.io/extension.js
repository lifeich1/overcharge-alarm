/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
'use strict';

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { Gio, GObject, St, GLib, UPowerGlib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;

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

let _cancel = null;
let _full_cnt = 0;
let _bat_cli = null;

function _cur_status() {
    if (_bat_cli) {
        return UPowerGlib.Device.state_to_string(_bat_cli.get_display_device().state);
    } else {
        return 'unknown';
    }
}

function _do_alarm() {
    Main.notify(_('Warning: battery overcharge'));
    // TODO custom cmd at prefs
    GLib.spawn_command_line_async('aplay /tmp/tell-overcharge.wav');
}

function _unless_alarm(i) {
    return ((i - 1) & i) != 0;
}

function _check() {
    if ('full' == _cur_status()) {
        _full_cnt ++;
        // TODO alarm cond in prefs
        if (_unless_alarm(_full_cnt)) return;
        _do_alarm();
    } else {
        _full_cnt = 0;
    }
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Overcharge-alarm Indicator'));

        this._icon = new St.Icon({
            icon_name: 'battery-symbolic',
            style_class: 'overcharge-alarm-icon',
            fallback_icon_name: 'battery-missing-symbolic',
        });
        this.add_child(this._icon);

        let item = new PopupMenu.PopupMenuItem(_('Show Inner data'));
        item.connect('activate', () => {
            Main.notify('battery status: ' + _cur_status() + '; cnt ' + _full_cnt);
        });
        this.menu.addMenuItem(item);
    }

    cliErr(e) {
        Main.notify(_('Error:') + e);
        this._icon.set_icon_name('battery-missing-symbolic');
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        _full_cnt = 0;
        _cancel = new Gio.Cancellable();
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);

        _upowerglib_client_async(_cancel)
            .then(c => {
                if (_cancel) _bat_cli = c;
            })
            .catch(e => {
                this._indicator.cliErr(e);
            });

        // TODO timeout sec add to prefs
        this._checkTaskId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT_IDLE, 60, () => {
            _check();
            return GLib.SOURCE_CONTINUE;
        });

        _check();
    }

    disable() {
        _cancel.cancel();
        GLib.Source.remove(this._checkTaskId);
        this._checkTaskId = null;
        this._indicator.destroy();
        this._indicator = null;
        _full_cnt = 0;
        _cancel = null;
        _bat_cli = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
