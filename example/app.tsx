import * as React from "react";
import * as ReactDOM from "react-dom";

import useEvents, { EventProvider } from "../src/";

const App = (): React.ReactElement => {
  const [value, setValue] = React.useState(0);
  const { execute, status, data, error } = useEvents(
    "my-event",
    "my:event",
    {}
  );

  React.useEffect(() => {
    if (data) {
      console.warn(data);
      setValue(value + data.payload?.increment);
    }
    if (error) console.error(error);
  }, [status, data, error]);

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
  <EventProvider hostname=".">
    <React.Suspense fallback="Loading...">
      <App />
    </React.Suspense>
  </EventProvider>,
  document.querySelector("main")
);
