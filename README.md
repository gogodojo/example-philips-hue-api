# philips-hue-code-challenge

## Getting Started
1. Install and run a Hue Bridge Simulator:
    1. Install a Hue Bridge Simulator (eg. https://www.npmjs.com/package/hue-simulator) (eg. "sudo npm install -g hue-simulator").
    1. In a terminal, start the Hue Bridge Simulator serving to localhost:80 (eg. "sudo hue-simulator").
    1. Browse to Hue Bridge Simulator at http://localhost:80.
1. In a new browser tab/window, browse to this app's index.html file (or serve it at a known address).
1. Open your browser's Dev Tools to observe the JS runtime console for this app.
1. Back in the bridge simulator tab/window, click the [Link-Button] button (to put the bridge into "link" mode).
1. Quickly (within 30 seconds) return to and refresh the code-challenge app window/tab to connect it to the bridge in privileged mode.
1. Monitor browser Dev Tools console for messages.
1. Expect: initial light status reported.
1. Expect: light status changes to be reported within 2 seconds after manually setting/modifying the state of light in the bridge simulator window.
1. Note: Application continuously polls bridge every 2 seconds for changes, and will stop polling after 60 continuous seconds without any detected light changes.

## Notes
* Should work on evergreen browsers that support native ES6 (Chrome, Safari, Edge).
* If you see "link button not pressed" error message, try clicking [Link-Button] again in bridge simulator window/tab and reloading the app page.
* The Jasmine unit test suite (below) will automatically run on page load.
