import { environment } from '@env/environment';

class telemetryDetails {
  readonly telemetryDetails = {
    channel: window.location.hostname,
    host: environment.telemetryUrl,
    key: 'gyte5565fdbgbngfnhgmnhmjgm,jm,',
    secret: 'gnjhgjugkk',
    config: {
      pdata: {
        id: 'sense',
        ver: 'v0.1',
        pid: 'sense',
      },
    },
    startEdata: {},
    options: {},
  };
}

export const configuration = new telemetryDetails();
