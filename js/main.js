// uses config.js
// uses HueBridgeService.js
// uses lights.js

// IIFE to wrap scope
;(() => {

  ///////////////////////////////////// ENTRY POINT

  // create services
  const hueBridgeConfig = HueApp.bridgeConfig;
  const hueBridgeService = new HueBridgeService(hueBridgeConfig);
  const lightsController = new LightsController(hueBridgeService);


  // promise to discover, ping, and connect user to bridge
  // NOTE: bridge discovery is not implemented; using simulator on localhost:80
  // NOTE: currently NOT persisting (in localstorage) the username for this application;
  //       you will need to "re-Link" after every refresh
  // TODO: consider moving connection flow into the LightsController constructor; here for clarity
  const whenConnected = hueBridgeService.ping()
    .then(() => hueBridgeService.connectUser())
    // hydrate bridge-provided username into config for use by all sussequent API calls
    .then(username => hueBridgeConfig.username = username);

  // interact with the the bridge after it has connected
  whenConnected
    // REQUIREMENT #0 - fetch all the lights and their states
    .then(() => lightsController.fetchLights())
    // REQUIREMENT #1 - report the lights and their states
    .then(fetchedLights => lightsController.reportLights(fetchedLights))
    // REQUIREMENT #2 - continuously monitor light state changes
    .then(fetchedLights => {
      lightsController.monitorLights(
        fetchedLights,
        HueApp.appConfig.monitorLightsPollIntervalMs,
        HueApp.appConfig.monitorLightsStopAfterIntervalMs
      );
    })
    .catch(console.error.bind(console));
})();
