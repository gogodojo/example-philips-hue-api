
// unit-tests for lightsController
// NOTE: covers most of the main logic
// TODO: add tests to simulate/mock real flows, including timers

describe("LightsController", function() {

  var hueBridgeConfig;
  var hueBridgeController;
  var lightsController;

  beforeEach(function() {
    hueBridgeConfig = HueApp.bridgeConfig;
    hueBridgeService = new HueBridgeService(hueBridgeConfig);
    lightsController = new LightsController(hueBridgeService, hueBridgeConfig);
  });

  it("should have been constructed with a bridge service", function() {
    expect(lightsController.hueBridgeService).toEqual(hueBridgeService);
  });

  describe("method: formatJSON", function() {
    it("should convert a JS object to 2-space-indented pretty JSON", function() {
      const jsObject = { foo: 1 };
      const prettyJSON = '{\n  "foo": 1\n}';
      expect(lightsController.prettyJSON(jsObject)).toEqual(prettyJSON);
    });

    it("should convert an undefined input to undefined output", function() {
      const jsObject = { foo: 1 };
      expect(lightsController.prettyJSON()).toBeUndefined();
    });
  });

  describe("method: normalizeApiBrightness", function() {
    it("should normalize API brightness 0 to percentage 0", function() {
      expect(lightsController.normalizeApiBrightness(0)).toEqual(0);
    });

    it("should normalize API brightness 254 to percentage 100", function() {
      expect(lightsController.normalizeApiBrightness(254)).toEqual(100);
    });

    it("should normalize API brightness 1 to percentage 0 (rounding down)", function() {
      expect(lightsController.normalizeApiBrightness(1)).toEqual(0);
    });

    it("should normalize API brightness 2 to percentage 1 (rounding up)", function() {
      expect(lightsController.normalizeApiBrightness(2)).toEqual(1);
    });

    it("should normalize API brightness -999 to percentage 0 (lower bound)", function() {
      expect(lightsController.normalizeApiBrightness(-999)).toBe(0);
    });

    it("should normalize API brightness 999 to percentage 100 (upper bound)", function() {
      expect(lightsController.normalizeApiBrightness(999)).toBe(100);
    });

    it("should return NaN if input is non-numeric", function() {
      expect(lightsController.normalizeApiBrightness('foo')).toBeNaN();
    });

    it("should return NaN if input is undefined", function() {
      expect(lightsController.normalizeApiBrightness()).toBeNaN();
    });
  });

  describe("method: mapLightDetails", function() {

    it("should map a correct API structure", function() {
      const id = 999;
      const apiLightDetails = {
        "state": {
          "on": false,
          "bri": 0,
          "hue": 0,
          "sat": 0,
          "xy": [
            0,
            0
          ],
          "ct": 0,
          "alert": "none",
          "effect": "none",
          "colormode": "hs",
          "reachable": true
        },
        "type": "Extended color light",
        "name": "Hue Lamp 1",
        "modelid": "LCT001",
        "swversion": "65003148",
        "pointsymbol": {
          "1": "none",
          "2": "none",
          "3": "none",
          "4": "none",
          "5": "none",
          "6": "none",
          "7": "none",
          "8": "none"
        }
      };
      const mappedLightDetails = {
        name: "Hue Lamp 1",
        id: "999",
        on: false,
        brightness: 0
      };

      expect(lightsController.mapLightDetails(id, apiLightDetails)).toEqual(mappedLightDetails);
    });

    it("should throw on incorrect API structure", function() {
      const id = 999;
      const apiLightDetails = {
        "name": "Hue Lamp 1",
      };
      expect(() => {lightsController.mapLightDetails(id, apiLightDetails)}).toThrow();
    });

    it("should throw on missing parameters", function() {
      const id = 999;
      const apiLightDetails = {
        "name": "Hue Lamp 1",
      };
      expect(() => {lightsController.mapLightDetails(id)}).toThrow();
      expect(() => {lightsController.mapLightDetails(apiLightDetails)}).toThrow();
      expect(() => {lightsController.mapLightDetails()}).toThrow();
    });

  });
  describe("method: compareLightStates", function() {

    it("should return an empty array if inputs are identical", function() {
      const previous = {
        name: "Hue Lamp 1",
        id: "999",
        on: false,
        brightness: 0
      };
      const current = Object.assign({}, previous);    // clone
      const deltas = [];

      expect(lightsController.compareLightStates(previous, current)).toEqual(deltas);
    });

    it("should return an array of each difference as objects in no particular order", function() {
      const previous = {
        name: "Hue Lamp 1",
        id: "999",
        on: false,
        brightness: 0
      };
      const current = {
        name: "Hue Lamp 99",
        id: "999",
        on: true,
        brightness: 100
      };
      const deltas = [
        {
          id: "999",
          name: "Hue Lamp 99"
        },
        {
          id: "999",
          on: true
        },
        {
          id: "999",
          brightness: 100
        }
      ];

      const output = lightsController.compareLightStates(previous, current);

      expect(output.length).toBe(3);

      deltas.forEach((delta) => {
        expect(output).toContain(delta);
      })
    });

    it("should throw on inputs with different ids", function() {
      const previous = {
        id: "111"
      };
      const current = {
        id: "999"
      };
      expect(() => {lightsController.compareLightStates(previous, current)}).toThrow();
    });

    it("should throw on missing inputs", function() {
      const previous = {
        id: "111"
      };
      const current = {
        id: "999"
      };
      expect(() => {lightsController.compareLightStates(previous)}).toThrow();
      expect(() => {lightsController.compareLightStates(current)}).toThrow();
      expect(() => {lightsController.compareLightStates()}).toThrow();
    });

  });


  describe("method: reportLightStateChanges", function() {

    beforeEach(function() {
      spyOn(console, 'log');
      spyOn(console, 'info');
    });

    // it("should testspy", function() {
    //   console.log('foo');
    //   console.log('bar');
    //   expect(console.log).toHaveBeenCalled();
    //   expect(console.log).toHaveBeenCalledWith('foo');
    //   expect(console.log).toHaveBeenCalledWith('bar');
    //   expect(console.log.calls.count()).toEqual(2);
    // });

    it("should output nothing and return empty string if inputs are identical", function() {
      const previous = {
        1: {
          name: "Hue Lamp 1",
          id: "999",
          on: false,
          brightness: 0
        }
      };
      const current = Object.assign({}, previous);    // clone

      expect(lightsController.reportLightStateChanges(previous, current)).toBe('');
      expect(console.log).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });

    it("should output the array of differences and return true", function() {
      const previous = {
        1: {
          name: "Hue Lamp 1",
          id: "1",
          on: false,
          brightness: 0
        }
      };
      const current = {
        1: {
          name: "Hue Lamp 1",
          id: "1",
          on: true,
          brightness: 100
        }
      };
      const deltas = [
        '{\n  "id": "1",\n  "on": true\n}',
        '{\n  "id": "1",\n  "brightness": 100\n}'
      ];

      const actual = lightsController.reportLightStateChanges(previous, current);
      expect(console.info).toHaveBeenCalledWith('----- light changes -----');
      expect(console.log).toHaveBeenCalledWith(actual);

      deltas.forEach((delta) => {
        expect(actual).toContain(delta);
      })
    });

    it("should throw if the inputs are not parallel (in keys)", function() {
      const previous = {
        111: {
          name: "Hue Lamp 1",
          id: "111",
          on: false,
          brightness: 0
        }
      };
      const current = {
        999: {
          name: "Hue Lamp 1",
          id: "999",
          on: true,
          brightness: 100
        }
      };

      expect(() => { lightsController.reportLightStateChanges(previous, current); }).toThrow();
      expect(console.info).not.toHaveBeenCalledWith();
      expect(console.log).not.toHaveBeenCalledWith();
    });

  });

});
