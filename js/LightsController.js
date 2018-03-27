

class LightsController {

  constructor(bridgeService) {
    this.hueBridgeService = bridgeService;
  }


  // utility to expose missing parameters
  throwIfMissing() {
    throw new Error('Missing parameter');
  }

  // returns prettified JSON string
  prettyJSON(json) {
    return JSON.stringify(json, null, 2);
  }

  // normalize API brightness from numeric-castable (0..254) to integer percentage (0..100)
  // - input will be forced into bounds 0..254
  // - returns NaN for non-numeric-castable input
  normalizeApiBrightness(apiBrightness) {
    apiBrightness = Math.min(254, apiBrightness);
    apiBrightness = Math.max(0, apiBrightness);
    return Math.round(apiBrightness * 100 / 254);
  }

  // normalize and map the API's light details to App's structure
  mapLightDetails(id = throwIfMissing(), lightDetails = throwIfMissing()) {
    return {
      name: lightDetails.name,
      id: String(id),
      on: lightDetails.state.on,
      brightness: this.normalizeApiBrightness(lightDetails.state.bri)
    };
  }

  // compare a light's previous state with a light's new state
  // - return cummulative deltas in prop values as an array of objects
  //   specifying the id of the light and each new property value
  compareLightStates(prevState = throwIfMissing(), newState= throwIfMissing()) {
    // expect both states to refer to the same lights
    if (prevState.id !== newState.id) throw new Error('ids are unexpectedly different');

    // reduce differences in key:values to array of individual deltas
    // NOTE: assuming same keys are present in both light objects
    const id = prevState.id;
    const props = Object.keys(prevState);

    const deltas = props.reduce((deltas, prop, index, array) => {
      if (prevState[prop] !== newState[prop]) {
        const delta = {
          id: id,
          [prop]: newState[prop]
        }
        deltas.push(delta);
      }
      return deltas;
    }, []);

    return deltas;
  }

  // assemble an array of light promises to fetch each light detail
  // - promises are in key order of provided model
  // - each promise returns a response object: {light-id : {light-details}}
  getLightDetailPromises(lights) {
    const ids = Object.keys(lights);
    const lightDetailPromises = ids.map(id => {
      return this.hueBridgeService.getLightDetails(id)
        .then(lightDetails => {
          const mappedLightDetails = this.mapLightDetails(id, lightDetails);
          return { [id]: mappedLightDetails };
        })
        .catch(console.error.bind(console));
    });
    return lightDetailPromises;
  }

  // promise to fetch light details for each key in a provided key-value map
  // expecting: {1: {any}, 2: {...}, ...}
  // returns new map: {1: {fetched-light-details}, 2: {...}, ...}
  fetchLightDetails(lights) {
    const lightDetailPromises = this.getLightDetailPromises(lights);

    // process all promises in parallel, returning a fully hydrated lights model
    // NOTE: This may swamp the API, so may need to batch, add governor, or
    //       process each promise sequentially.
    return Promise.all(lightDetailPromises)
      .then((responses) => {
        // assemble responses into model
        const newLights = Object.assign({}, ...responses);
        return newLights;
      })
      .catch(console.error.bind(console));
  }

  // promise to fetch all lights and their details
  fetchLights() {
    return this.hueBridgeService.getLights()
      .then(lights => {
        return this.fetchLightDetails(lights);
      })
      .catch(console.error.bind(console));
  }

  // promise to continously poll for changes
  // - stop polling if no changes detected within resettable stopIntervalMs interval
  // NOTE: consider refactoring if the bridge should ever support notifications
  //       over push or socket or some other pub/sub or event-driven mechanism
  monitorLights(lights, intervalMs, stopIntervalMs, stopTime = Date.now() + stopIntervalMs) {
    return this.fetchLightDetails(lights)
      .then(fetchedLights => {
        const didChange = this.reportLightStateChanges(lights, fetchedLights);

        // if change detected, reset stop time
        const now = Date.now();
        if (didChange) {
          stopTime = now + stopIntervalMs;
        }

        // check stop time
        if (now < stopTime) {
          // recurse after timeout with current (fetched) lights model
          setTimeout(() => {
            this.monitorLights(fetchedLights, intervalMs, stopIntervalMs, stopTime);
          }, intervalMs);
        } else {
          console.info(`----- stopping; no changes detected in ${ stopIntervalMs / 1000 } seconds`);
        }
      })
      .catch(console.error.bind(console));
  }

  // given a set of lights and a potentially new state of those lights
  // outputs a formatted list of state changes between each light set
  // - side-effect: writes to console
  // - returns the output string
  reportLightStateChanges(prevLights, currLights) {
    const previds = Object.keys(prevLights);
    const currIds = Object.keys(currLights);
    if (JSON.stringify(previds) !== JSON.stringify(currIds)) {
      throw new Error('unparallel input keys');
    }

    // reduce all light changes to a single output string
    const outString = previds.reduce((accumOutput, id) => {
      // get changes for this light
      const deltaArray = this.compareLightStates(prevLights[id], currLights[id]);
      // assemble formatted string for any changes to this light
      const deltaString = deltaArray.reduce((accumDelta, delta) => {
        return accumDelta + this.prettyJSON(delta) + '\n';
      }, '');
      return accumOutput + deltaString;
    }, '');

    // report deltas, if any
    if (outString) {
      console.info('----- light changes -----');
      console.log(outString);
    }

    return outString;
  }

  // reports the current light model, if any
  // - side-effect: writes to console
  reportLights(lights) {
    const output = this.prettyJSON(Object.values(lights));
    output && console.log(output);
    return lights;  // passthru for chaining
  }

}
