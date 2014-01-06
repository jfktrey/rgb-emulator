RGB
=================

About
-----------------

RGB is a web-based Gameboy Color emulator for touch-based devices that aims to be a replacement for native applications. When completed, it will integrate with your Google account, loading ROMs and settings from Google Drive. RGB itself will also be stored on a user's Google Drive account, allowing for a decentralized web application that doesn't cost any money to host.

RGB is heavily based on Grant Galitz's fantastic [GameBoy-Online emulator](https://github.com/grantgalitz/GameBoy-Online), retooling it to work with mobile, touch-based browsers.

Scope
-----------------

Currently, the only devices which are officially supported are the iPhones - specifically, the iPhone 5 and iPhone 5S, both requiring iOS 7. Official support is unlikely to come to older iPhones. iPads and Android-based devices are currently unsupported, though support is likely to come to devices with specifications comparable to the iPhone 5 and up. Chrome is the targeted browser for Android devices.

Status
-----------------

RGB is not ready for general use yet. Many features work, but many core ones have not been implemented yet. Most notably, RGB still uses Dropbox instead of Google Drive for a cloud-based storage platform, despite what the "Connect" button implies. To test out RGB right now, one needs to manually add ROMs to the folder it creates in Dropbox. This will change soon via the ability to add ROMs to Google Drive through a web-based interface that uses MEGA's API to access ROM files.

License
-----------------

See LICENSE.md