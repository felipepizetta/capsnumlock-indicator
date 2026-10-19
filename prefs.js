import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class IndicatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: _('Indicator Behavior'),
            description: _('Configure how the Caps Lock and Num Lock indicators are displayed.'),
        });
        page.add(group);

        const settings = this.getSettings();

        // Safest approach across Adw versions: ActionRow + Gtk.Switch
        const createSwitchRow = (title, subtitle, key) => {
            const row = new Adw.ActionRow({ title, subtitle });
            const toggle = new Gtk.Switch({
                active: settings.get_boolean(key),
                valign: Gtk.Align.CENTER,
            });

            settings.bind(key, toggle, 'active', Gio.SettingsBindFlags.DEFAULT);
            row.add_suffix(toggle);
            row.activatable_widget = toggle;
            return row;
        };

        group.add(createSwitchRow(
            _('Show Caps Lock'),
            _('Display the Caps Lock indicator in the top panel.'),
            'show-caps-lock'
        ));

        group.add(createSwitchRow(
            _('Show Num Lock'),
            _('Display the Num Lock indicator in the top panel.'),
            'show-num-lock'
        ));

        group.add(createSwitchRow(
            _('Hide when inactive'),
            _('Hide the indicator completely when the lock is turned off.'),
            'hide-when-off'
        ));

        group.add(createSwitchRow(
            _('Show notifications'),
            _('Display a system notification when Caps/Num Lock is toggled.'),
            'show-notifications'
        ));
        group.add(createSwitchRow(
            _('Auto enable Num Lock'),
            _('Automatically turn Num Lock back on when it is turned off.'),
            'auto-numlock'
        ));

        window.add(page);
    }
}
