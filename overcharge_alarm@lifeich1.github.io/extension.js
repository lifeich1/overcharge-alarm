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

const { Gio, GObject, St, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();

const { Battery } = Me.imports.mods.battery;

const _ = ExtensionUtils.gettext;

let _cancel = null;
let _full_cnt = 0;
let _cur_status = '';

async function _pull() {
    _cur_status = await Battery.battery_status(_cancel);
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
    if ('Full' == _cur_status) {
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
        super._init(0.0, _('My Shiny Indicator'));

        this._icon = new St.Icon({
            icon_name: 'battery-level-50-symbolic',
            style_class: 'overcharge-alarm-icon',
            fallback_icon_name: 'battery-level-50-symbolic',
        });
        this.add_child(this._icon);

        let item = new PopupMenu.PopupMenuItem(_('Show Notification'));
        item.connect('activate', () => {
            Main.notify(_('battery status: ' + _cur_status + '; cnt ' + _full_cnt));
        });
        this.menu.addMenuItem(item);
    }

    updateBatStat() {
        let s = _cur_status;
        let i = 'battery-missing-symbolic';
        if ('Full' == s) {
            i = 'battery-level-100-charging-symbolic';
        } else if ('Discharging' == s) {
            i = 'battery-level-60-symbolic';
        } else if ('Charging' == s) {
            i = 'battery-level-40-charging-symbolic';
        }
        this._icon.set_icon_name(i);
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    _trigger_pull() {
        _pull().then(() => {
            this._indicator.updateBatStat();
            _check();
        });
    }

    enable() {
        _full_cnt = 0;
        _cancel = new Gio.Cancellable();
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);

        // TODO timeout sec add to prefs
        this._checkTaskId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT_IDLE, 60, () => {
            this._trigger_pull();
            return GLib.SOURCE_CONTINUE;
        });

        this._trigger_pull();
    }

    disable() {
        GLib.Source.remove(this._checkTaskId);
        this._checkTaskId = null;
        _cancel.cancel();
        this._indicator.destroy();
        this._indicator = null;
        _full_cnt = 0;
        _cancel = null;
        _cur_status = '';
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
