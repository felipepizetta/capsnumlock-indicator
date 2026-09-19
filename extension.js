import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

// Custom Notification widget for the top-right corner
const IndicatorNotification = GObject.registerClass(
    class IndicatorNotification extends St.BoxLayout {
        _init() {
            super._init({
                style_class: 'osd-window capsnum-notification',
                orientation: Clutter.Orientation.HORIZONTAL,
                opacity: 0,
                visible: false
            });

            this._icon = new St.Icon({
                icon_name: 'changes-prevent-symbolic',
                icon_size: 24,
                style_class: 'capsnum-notification-icon'
            });

            this._label = new St.Label({
                text: '',
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'capsnum-notification-label'
            });

            this.add_child(this._icon);
            this.add_child(this._label);

            // Add to the Main UI layout
            Main.uiGroup.add_child(this);

            this._timeoutId = 0;
        }

        showNotification(iconName, text) {
            this._icon.icon_name = iconName;
            this._label.text = text;

            // Remove previous timeouts/animations
            if (this._timeoutId) {
                GLib.source_remove(this._timeoutId);
                this._timeoutId = 0;
            }
            this.remove_all_transitions();

            // Render it invisibly first so Clutter fully allocates its width
            this.opacity = 0;
            this.show();

            // Defer positioning and fading to the next event loop frame
            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                let primaryMonitor = Main.layoutManager.primaryMonitor;

                // this.width is now 100% correctly computed by the layout manager
                let x = primaryMonitor.x + primaryMonitor.width - this.width - 20;
                let y = primaryMonitor.y + Main.panel.height + 20;

                this.set_position(x, y);

                // Fade In smoothly
                this.ease({
                    opacity: 255,
                    duration: 200,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                    onComplete: () => {
                        // Wait 1.5 seconds then fade out
                        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
                            this._timeoutId = 0;
                            this.ease({
                                opacity: 0,
                                duration: 300,
                                mode: Clutter.AnimationMode.EASE_IN_QUAD,
                                onComplete: () => this.hide()
                            });
                            return GLib.SOURCE_REMOVE;
                        });
                    }
                });
                return GLib.SOURCE_REMOVE;
            });
        }

        destroy() {
            if (this._timeoutId) {
                GLib.source_remove(this._timeoutId);
                this._timeoutId = 0;
            }
            this.remove_all_transitions();
            super.destroy();
        }
    });

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(settings) {
            super._init(0.0, 'Caps/Num Lock Indicator');

            this._settings = settings;

            this._box = new St.BoxLayout({
                style_class: 'panel-status-indicators-box',
            });

            // Holders for the visual elements
            this._capsWidget = null;
            this._numWidget = null;

            this._setupWidgets();

            this.add_child(this._box);

            this._seat = global.stage.context.get_backend().get_default_seat();
            this._keymap = this._seat.get_keymap();

            // Disable the click menu to make this a passive indicator
            this.reactive = false;

            // Listen for keyboard state changes (Caps Lock, Num Lock)
            this._keymapStateChangedId = this._keymap.connect('state-changed', this._syncState.bind(this));

            // Listen for settings changes
            this._settingsChangedId = this._settings.connect('changed', this._onSettingsChanged.bind(this));

            // Initial state sync
            this._syncState();
        }

        _setupWidgets() {
            if (this._capsWidget) {
                this._capsWidget.destroy();
            }
            if (this._numWidget) {
                this._numWidget.destroy();
            }

            this._capsWidget = new St.Icon({
                icon_name: 'changes-prevent-symbolic', // Padlock
                style_class: 'system-status-icon capsnum-indicator'
            });
            this._numWidget = new St.Icon({
                icon_name: 'input-keyboard-symbolic', // Keyboard graphic
                style_class: 'system-status-icon capsnum-indicator'
            });

            this._box.add_child(this._capsWidget);
            this._box.add_child(this._numWidget);
        }

        _onSettingsChanged() {
            this._setupWidgets();
            this._syncState();
        }

        _syncState() {
            let capsState = this._keymap.get_caps_lock_state();
            let numState = this._keymap.get_num_lock_state();
            let showCaps = this._settings.get_boolean('show-caps-lock');
            let showNum = this._settings.get_boolean('show-num-lock');
            let hideWhenOff = this._settings.get_boolean('hide-when-off');



            // Update Caps Widget
            if (showCaps) {
                if (capsState) {
                    this._capsWidget.show();
                    this._capsWidget.icon_name = 'changes-prevent-symbolic';
                    this._capsWidget.remove_style_class_name('capsnum-indicator-off');
                    this._capsWidget.add_style_class_name('capsnum-indicator-on');
                    this._capsWidget.ease({
                        opacity: 255,
                        duration: 200,
                        mode: Clutter.AnimationMode.EASE_OUT_QUAD
                    });
                } else {
                    if (hideWhenOff) {
                        this._capsWidget.ease({
                            opacity: 0,
                            duration: 200,
                            mode: Clutter.AnimationMode.EASE_IN_QUAD,
                            onComplete: () => this._capsWidget.hide()
                        });
                    } else {
                        this._capsWidget.show();
                        this._capsWidget.icon_name = 'changes-allow-symbolic';
                        this._capsWidget.remove_style_class_name('capsnum-indicator-on');
                        this._capsWidget.add_style_class_name('capsnum-indicator-off');
                        this._capsWidget.ease({
                            opacity: 255,
                            duration: 200,
                            mode: Clutter.AnimationMode.EASE_OUT_QUAD
                        });
                    }
                }
            } else {
                this._capsWidget.hide();
            }

            // Update Num Widget
            if (showNum) {
                if (numState) {
                    this._numWidget.show();
                    this._numWidget.icon_name = 'input-keyboard-symbolic';
                    this._numWidget.remove_style_class_name('capsnum-indicator-off');
                    this._numWidget.add_style_class_name('capsnum-indicator-on');
                    this._numWidget.ease({
                        opacity: 255,
                        duration: 200,
                        mode: Clutter.AnimationMode.EASE_OUT_QUAD
                    });
                } else {
                    if (hideWhenOff) {
                        this._numWidget.ease({
                            opacity: 0,
                            duration: 200,
                            mode: Clutter.AnimationMode.EASE_IN_QUAD,
                            onComplete: () => this._numWidget.hide()
                        });
                    } else {
                        this._numWidget.show();
                        this._numWidget.icon_name = 'input-keyboard-virtual-symbolic';
                        this._numWidget.remove_style_class_name('capsnum-indicator-on');
                        this._numWidget.add_style_class_name('capsnum-indicator-off');
                        this._numWidget.ease({
                            opacity: 255,
                            duration: 200,
                            mode: Clutter.AnimationMode.EASE_OUT_QUAD
                        });
                    }
                }
            } else {
                this._numWidget.hide();
            }

            // Hide entire indicator if both are hidden
            if (!this._capsWidget.visible && !this._numWidget.visible) {
                this.hide();
            } else {
                this.show();
            }

            // Fire notification if it changed externally (not via standard init)
            // We detect a change if our popup toggles were previously set to something else
            let showNotifications = this._settings.get_boolean('show-notifications');
            if (showNotifications && this._initialized) {
                if (!this._customNotification) {
                    this._customNotification = new IndicatorNotification();
                }

                if (capsState !== this._lastCapsState) {
                    let capsIcon = capsState ? 'changes-prevent-symbolic' : 'changes-allow-symbolic';
                    this._customNotification.showNotification(capsIcon, 'Caps Lock ' + (capsState ? 'ON' : 'OFF'));
                }
                if (numState !== this._lastNumState) {
                    let numIcon = numState ? 'input-keyboard-symbolic' : 'input-keyboard-virtual-symbolic';
                    this._customNotification.showNotification(numIcon, 'Num Lock ' + (numState ? 'ON' : 'OFF'));
                }
            }

            // Save state to avoid repeated notifications
            this._lastCapsState = capsState;
            this._lastNumState = numState;
            this._initialized = true;
        }

        destroy() {
            if (this._keymapStateChangedId) {
                this._keymap.disconnect(this._keymapStateChangedId);
                this._keymapStateChangedId = null;
            }
            if (this._settingsChangedId) {
                this._settings.disconnect(this._settingsChangedId);
                this._settingsChangedId = null;
            }
            if (this._customNotification) {
                this._customNotification.destroy();
                this._customNotification = null;
            }
            super.destroy();
        }
    });

export default class CapsNumExtension extends Extension {
    enable() {
        this._indicator = new Indicator(this.getSettings());
        Main.panel.addToStatusArea('capsnum-indicator', this._indicator, 1, 'right');
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
