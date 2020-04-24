import * as React from "react";

import "@testing-library/jest-dom";
import { renderHook, act } from "@testing-library/react-hooks";

import useEvents, { EventProvider, status } from "../";
import events from "@guiabolsobr/events-protocol/client";

jest.mock("@guiabolsobr/events-protocol/client");
const mockedEvents = events as jest.Mocked<typeof events>;

const possibleValue: {
  value: any | undefined;
  error: any | undefined;
} = {
  value: undefined,
  error: undefined,
};

mockedEvents.generateFetchEventByName.mockReturnValue(() => {
  if (possibleValue.value) return Promise.resolve(possibleValue.value);
  else return Promise.reject(possibleValue.error);
});

describe("createUseEvents", () => {
  const hostname = "teste-hostname";
  let id: string;
  beforeEach(() => {
    possibleValue.value = undefined;
    possibleValue.error = undefined;

    id = Math.random().toString(16).substr(2);
  });

  it("must respond with success with a simple success event", async () => {
    possibleValue.value = {
      teste: "1",
    };

    const { waitForValueToChange, result } = renderHook(
      () => useEvents(id, "event:test", {}),
      {
        wrapper: ({ children }) =>
          React.createElement(EventProvider, {
            children,
            hostname,
          }),
      }
    );

    expect(result.current.status).toBe(status.IDLE);

    act(() => result.current.execute());

    await waitForValueToChange(() => result.current.status);

    expect(result.current.data).toBe(possibleValue.value);
  });

  it("must respond return an error in case of problem", async () => {
    possibleValue.error = new Error("error test");

    const { waitForValueToChange, result } = renderHook(
      () => useEvents(id, "event:test", {}),
      {
        wrapper: ({ children }) =>
          React.createElement(EventProvider, {
            children,
            hostname,
          }),
      }
    );

    expect(result.current.status).toBe(status.IDLE);

    act(() => result.current.execute());

    await waitForValueToChange(() => result.current.status);

    expect(result.current.data).toBeUndefined();
    expect(result.current.error.message).toBe(possibleValue.error.message);
  });
});
