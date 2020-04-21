import * as React from "react";
import client from "@guiabolsobr/events-protocol/client";

export interface ProcessEnv {
  NODE_ENV: string;
}

const status = {
  IDLE: 0,
  LOADING: 1,
  DONE: 2,
  ERROR: 3,
  NO_AUTO: 4,
  COMPLETED: 5,
};

type Status = number;
type CacheItem = {
  promise?: Promise<Response>;
  status: Status;
};
type Cache = {
  [key: string]: CacheItem;
};

const cache: Cache = {};

export type UseFetcher = () => void;

type Mode = true | false;
export const mode = {
  NO_AUTO: false,
  AUTO: true,
};

export type Callback = (
  error: Error | undefined,
  data: any | undefined
) => void;
export type UseEventsConfig = {
  _payload?: any;
  _auth?: any;
};
export type CreateUseEvents = (
  useEvents: UseEventsConfig,
  callback: Callback,
  controls: [any?]
) => UseFetcher;

export type CreateUseEventsParams = {
  hostname: string;
  event: string;
  metadata?: any;
  auto: boolean;
};

export default function createUserEvents(
  id: string,
  { hostname, event, metadata, auto = mode.AUTO }: CreateUseEventsParams
): CreateUseEvents {
  const sendEvent = client.generateFetchEventByName({
    hostname,
    metadata: metadata || {},
  });

  return (
    { _payload, _auth }: UseEventsConfig,
    _callback: Callback,
    controls: [any]
  ): UseFetcher => {
    const [noAuto, setNoAuto] = React.useState<boolean>(!auto);
    const [data, setData] = React.useState<any>(undefined);
    const [error, setError] = React.useState<Error | undefined>(undefined);
    const [payload, setPayload] = React.useState<any | undefined>(_payload);
    const [auth, setAuth] = React.useState<any | undefined>(_auth);

    let local: CacheItem | undefined = cache[id];

    const callback = React.useCallback(
      (error, data) => {
        if (typeof _callback === "function") {
          _callback(error, data);
        }
        if (local) local.status = status.COMPLETED;
      },
      [data, error, ...controls]
    );

    function checkStatus(status: Status): boolean {
      return (local && local?.status === status) || false;
    }

    function execute(_payload?: any, _auth?: any): void {
      setPayload(_payload);
      setAuth(_auth);

      delete cache[id];
      local = undefined;
      setNoAuto(false);

      setData(undefined);
      setError(undefined);

      console.log("execute scheduled", noAuto, local);
    }

    React.useEffect(() => {
      function resolver(): void {
        if (!local || !local.promise) return;
        local.promise
          .then((data) => {
            if (!local) return;
            local.status = status.DONE;
            setData(data);
          })
          .catch((err) => {
            if (!local) return;
            local.status = status.ERROR;
            const error = new Error(err?.payload?.code || err?.message || "");
            setError(error);
          });
      }

      if (local && local.status < status.DONE) resolver();
    }, [local]);

    if (process.env.NODE_ENV !== "production")
      console.info("Creating fetcher", local);

    if (checkStatus(status.IDLE)) {
      if (process.env.NODE_ENV !== "production") console.info("Loading");
      local.status = status.LOADING;
      throw local.promise;
    } else if (checkStatus(status.DONE)) {
      if (process.env.NODE_ENV !== "production") console.info("Done", data);
      callback(undefined, data);
    } else if (checkStatus(status.ERROR)) {
      if (process.env.NODE_ENV !== "production") console.error("Error", error);
      callback(error, undefined);
    } else if (noAuto && !local) {
      local = cache[id] = {
        status: status.NO_AUTO,
      };
      if (process.env.NODE_ENV !== "production") console.info("No auto", local);
    } else if (!local) {
      if (process.env.NODE_ENV !== "production")
        console.info("Idle", event, payload);
      local = cache[id] = {
        promise: sendEvent(event, payload, { isAuthorized: !!auth, auth }),
        status: status.IDLE,
      };
      throw local.promise;
    }

    return execute;
  };
}
