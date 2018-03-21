# josh-ai-coding-challenge

## Getting Started
1. Download a Hue Bridge Simulator (eg. https://www.npmjs.com/package/hue-simulator)
1. In a terminal, start the Hue Bridge Simulator serving to localhost:80
1. In separate browser window/tab, browse to Hue Bridge Simulator at http://localhost:80
1. Download and start this app (index.html).
1. Open your browser's Dev Tools to observe the JS runtime console
1. Back on the simulator tab/window, click the [Link-Button] button (to put the bridge into "link" mode)
1. Within 30 seconds, refresh the josh.ai app window/tab to connect it to the bridge in privileged mode and start running.
1. Monitor browser Dev Tools console for messages
1. Expect: initial light status reported
1. Expect: light status changes to be reported after setting (changing) state of light in bridge simulator manually.
1. Note: Application continuously polls bridge every 2 seconds for changes, and will stop polling after 60 continuous seconds without any detected light changes.
* If you see "link button not pressed" error message, try clicking [Link-Button] again in bridge simulator window/tab and reloading the app page.

The Jasmine unit test suite (below) will automatically run on page load.
