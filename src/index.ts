import * as React from "react";
import client from "@guiabolsobr/events-protocol/client";

const log = (...params: any): void => {
  if (process.env.NODE_ENV !== "production") console.log(...params);
};

export interface ProcessEnv {
  NODE_ENV: string;
}

type Status = number;
export const status = {
  IDLE: -1,
  START: 0,
  LOADING: 1,
  DONE: 2,
  ERROR: 3,
  COMPLETED: 4,
};

type CacheItem = {
  promise?: Promise<Response>;
  status: Status;
  sender: Function;
  execute?: Execute;
};
type Cache = {
  [key: string]: CacheItem;
};
const cache: Cache = {};

const baseContext = {
  auth: null,
  identity: {},
  metadata: {},
  hostname: null,
  updateAuth(auth: any): void {
    this.auth = { ...this.auth, auth };
  },
  updateIdentity(identity: any): void {
    this.identity = { ...this.identity, identity };
  },
  updateMetadata(metadata: any): void {
    this.metadata = { ...this.metadata, metadata };
  },
};
const EventContext = React.createContext(baseContext);

export const EventProvider = ({
  hostname = null,
  auth = null,
  identity = {},
  metadata = {},
  children = null,
}): React.ReactElement => {
  if (!hostname) throw new Error("You must provide a valid hostname");
  log("EventProvider", { hostname, auth, identity, metadata });

  return React.createElement(EventContext.Provider, {
    value: {
      ...baseContext,
      hostname,
      auth,
      identity,
      metadata,
    },
    children,
  });
};

type Execute = (payload?: any, auth?: any) => void;
export default function useEvents(
  id: string,
  event: string,
  config?: any
): {
  execute: Execute;
  data: any;
  error: any;
  status: Status;
} {
  const localContext = React.useContext(EventContext);
  log("useEvents context", localContext);

  const metadata = { ...localContext.metadata, ...(config?.metadata || {}) };
  const identity = { ...localContext.identity, ...(config?.identity || {}) };

  const [payload, setPayload] = React.useState<any | undefined>(
    config?.payload
  );
  const [auth, setAuth] = React.useState<any | undefined>(
    config?.auth || localContext.auth
  );

  const [data, setData] = React.useState<any>(undefined);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  let local: CacheItem = cache[id];

  if (!cache[id]) {
    local = cache[id] = {
      status: status.IDLE,
      sender: client.generateFetchEventByName({
        hostname: localContext.hostname,
        metadata: localContext.metadata,
      }),
    };
  }

  const [_status, _setStatus] = React.useState<Status>(local.status);
  function setStatus(value: Status): void {
    log("status", value);
    local.status = value;
    log("setStatus", local);
    _setStatus(local.status);
    log("setStatus", _status);
  }

  function checkStatus(status: Status): boolean {
    return (local && local?.status === status) || false;
  }

  function execute(_payload?: any, _auth?: any): void {
    if (!status.IDLE || !status.COMPLETED) {
      return;
    }

    if (_payload) setPayload(_payload);
    if (_auth) setAuth(_auth);

    setStatus(status.START);

    setData(undefined);
    setError(undefined);
    log("Executing", local);
  }

  React.useEffect(() => {
    function resolver(): void {
      if (!local || !local.promise) return;
      local.promise
        .then((data: any) => {
          if (!local) return;
          setStatus(status.DONE);
          localContext.updateAuth(data?.auth);
          setData(data);
        })
        .catch((err) => {
          if (!local) return;
          setStatus(status.ERROR);
          const error = new Error(err?.payload?.code || err?.message || "");
          setError(error);
        });
    }

    if (local && local.status < status.DONE) resolver();
  }, [local, _status]);

  if (process.env.NODE_ENV !== "production")
    console.info("Creating fetcher", local);

  if (checkStatus(status.LOADING)) {
    log("Loading");
  } else if (checkStatus(status.DONE)) {
    log("Done", data);
    setStatus(status.COMPLETED);
  } else if (checkStatus(status.ERROR)) {
    log("Error", data);
    setStatus(status.COMPLETED);
  } else if (checkStatus(status.START)) {
    log("Starting", local);
    local.promise = local.sender(event, payload, {
      isAuthorized: !!auth,
      auth,
      metadata,
      identity,
    });
    local.execute = execute;
    setStatus(status.LOADING);
    log("Started", local);
    throw local.promise;
  }

  return { execute, data, error, status: _status };
}
