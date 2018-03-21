
// interface wrapper to the Hue Bridge API
class HueBridgeService {

  constructor(bridgeConfig) {
    this.bridgeConfig = bridgeConfig;
    this.serviceUrl = `http://${ this.bridgeConfig.host }`;
  }

  // Response helper
  status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  }

  // Response helper
  nonEmpty(response) {
    if (!response.length) {
      return Promise.reject('empty server response');
    }
    return Promise.resolve(response);
  }

  // Response helper (for connectUser)
  validServerResponseUser(response) {
    const serverResponse = Array.isArray(response) ? response[0] : null;
    if (serverResponse) {
      const success = serverResponse.success;
      if (success && success.username) {
        return Promise.resolve(success.username);
      }
      const error = serverResponse.error;
      if (error) {
        return Promise.reject(error.description);
      }
    }
    return Promise.reject('unexpected /api server response');
  }

  // Response helper
  text(response) {
    return response.text();
  }

  // Response helper
  json(response) {
    return response.json();
  }


  // promise to ping by fetching the bridge's description.xml
  ping() {
    const url = `${ this.serviceUrl }/description.xml`;
    const request = new Request(url);

    return fetch(request)
      .then(this.text)
      .then(this.nonEmpty)
      .catch(error => {
        throw Error(error);
      })
  }

  // promise to create user on bridge
  // - on success, resolves with username provided by bridge
  // - on error, rejects with error description
  // - throws otherwise
  connectUser() {
    const url = `${ this.serviceUrl }/api`;
    const headers = new Headers({
      "Content-Type": "application/json"
    });
    const data = {
      devicetype: 'josh.ai.app',
      username: ''
    };
    const config = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    const request = new Request(url, config);

    return fetch(request)
      .then(this.status)
      .then(this.json)
      .then(this.validServerResponseUser)
      .catch(error => {
        throw Error(error);
      })
  }

  // promise to fetch lights on bridge
  getLights(id) {
    const idFrag = id ? `/${ id }` : '';
    const url = `${ this.serviceUrl }/api/${ this.bridgeConfig.username }/lights` + idFrag;

    return fetch(url)
      .then(this.status)
      .then(this.json)
      .catch(error => {
        throw Error(error);
      })
  }

  // promise to fetch a light's details
  // - delegates to getLights
  getLightDetails(lightId) {
    return this.getLights(lightId);
  }

}
