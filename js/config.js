
// some semi-namespaced configuration details

const HueApp = {};

HueApp.appConfig = {

  // interval/frequency to poll for light changes
  monitorLightsPollIntervalMs: 2 * 1000,

  // interval after which to stop poller if no light changes detected
  monitorLightsStopAfterIntervalMs: 60 * 1000
}

HueApp.bridgeConfig = {
  host: 'localhost:80',     // should be provided by service discovery (UPnP, eg.)
  appName: 'code-challenge.app',
  username: ''              // will be provided by bridge during user creation
}
