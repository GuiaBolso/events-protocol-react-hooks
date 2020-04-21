import * as React from "react";
import * as ReactDOM from "react-dom";

import createUseEvents, { mode } from "../src/createUseEvents";

const useEvents = createUseEvents("my-test-event", {
  hostname: "",
  event: "my:event:v1",
  auto: mode.NO_AUTO,
});

const App = (): React.ReactElement => {
  const [value, setValue] = React.useState(0);
  const execute = useEvents(
    {},
    (err, data) => {
      console.log("Callback", err, data, value);
      if (err) console.error(err);
      else if (data) setValue(value + data?.payload?.increment);
    },
    [value]
  );
  return (
    <>
      <p>{value}</p>
      <p>
        <button
          onClick={(): void => {
            console.log("executing increment");
            execute();
          }}
        >
          Increment
        </button>
      </p>
    </>
  );
};

ReactDOM.render(
  <React.Suspense fallback="Loading...">
    <App />
  </React.Suspense>,
  document.querySelector("main")
);
