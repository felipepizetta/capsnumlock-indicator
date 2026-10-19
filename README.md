# Caps/Num Lock Indicator

A lightweight and native GNOME Shell extension that displays the current status of Caps Lock and Num Lock directly on your top panel.

## Features

- **Real-time Status**: Instantly see if your Caps Lock or Num Lock is active.
- **Toggle from UI**: Click the indicator to open a dropdown menu and manually toggle the locks without touching the keyboard.
- **Customizable Appearance**: Choose between sleek system lock icons or classic "A" and "1" text labels.
- **Smart Hiding**: Option to completely hide the indicator when the locks are disabled to keep your top bar clean.
- **System Notifications**: Get a native GNOME notification bubble whenever a lock state changes.
- **Auto enable numlock**: Automatically turn Num Lock back on when it is turned off.

## Compatibility

- GNOME 45
- GNOME 46
- GNOME 47
- GNOME 48
- GNOME 49
- GNOME 50

*Supports both X11 and Wayland sessions.*

## Installation

### From Source
1. Clone the repository into your GNOME extensions directory:
   ```bash
   git clone <repository-url> ~/.local/share/gnome-shell/extensions/capsnum-indicator@felipeaupizetta
   ```
2. Compile the GSettings schema:
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/capsnum-indicator@felipeaupizetta/schemas/
   ```
3. Restart GNOME Shell (On X11, press `Alt+F2`, type `r`, and press Enter. On Wayland, log out and log back in).
4. Enable the extension via the **Extensions** app.

## Preferences

You can customize the extension behavior by clicking the "Settings" (gear) icon next to the extension in the GNOME Extensions app. 

Settings include:
- Show/Hide Caps Lock Indicator
- Show/Hide Num Lock Indicator
- Hide when inactive (instead of dimming)
- Use system icons (padlocks) instead of text labels
- Enable/Disable system notifications on toggle

## Limitations
Due to Wayland's strict security model, manual toggles from the UI menu rely on `Clutter.VirtualDevice`. If your compositor restricts virtual input devices, the toggle buttons in the menu will act only as visual indicators and will revert to hardware state. This works perfectly on standard GNOME 46 configurations.
