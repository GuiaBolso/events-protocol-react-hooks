import * as React from "react";

import "@testing-library/jest-dom";
import { renderHook, act } from "@testing-library/react-hooks";

import createUseEvents, { mode, CreateUseEvents } from "../";
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
  let useEvents: CreateUseEvents;
  let id: string;
  beforeEach(() => {
    possibleValue.value = undefined;
    possibleValue.error = undefined;

    id = Math.random().toString(16).substr(2);
  });

  it("must respond with success with a simple success event", async () => {
    possibleValue.value = {};
    let done = false;

    useEvents = createUseEvents(`teste-${id}`, {
      hostname: "any",
      event: "teste:event",
      auto: mode.AUTO,
    });

    const { waitForValueToChange } = renderHook(() =>
      useEvents(
        {},
        (err?: Error, data?: any) => {
          expect(err).toBeUndefined();
          expect(data).not.toBeUndefined();

          done = true;
        },
        []
      )
    );

    await waitForValueToChange(() => done);

    expect(done).toBeTruthy();
  });

  it("must set loading wile loading", async () => {
    possibleValue.value = {};
    let done = false;

    useEvents = createUseEvents(`teste-${id}`, {
      hostname: "any",
      event: "teste:event",
      auto: mode.AUTO,
    });

    const { waitForValueToChange } = renderHook(() =>
      useEvents(
        {},
        (err?: Error, data?: any) => {
          expect(err).toBeUndefined();
          expect(data).not.toBeUndefined();

          done = true;
        },
        []
      )
    );

    await waitForValueToChange(() => done);

    expect(done).toBeTruthy();
  });

  it("must respond with error with an error response event", async () => {
    possibleValue.error = new Error("correctError");
    let done = false;

    useEvents = createUseEvents(`teste-${id}`, {
      hostname: "any",
      event: "teste:event",
      auto: mode.AUTO,
    });

    const { waitForValueToChange } = renderHook(() =>
      useEvents(
        {},
        (err?: Error, data?: any) => {
          expect(data).toBeUndefined();

          expect(err).not.toBeNull();
          expect(err).not.toBeUndefined();
          expect(err.message).toBe("correctError");

          done = true;
        },
        []
      )
    );

    await waitForValueToChange(() => done);

    expect(done).toBeTruthy();
  });

  it("must respond only after 'execute' had been called", async () => {
    possibleValue.value = {};
    let done = false;

    useEvents = createUseEvents(`teste-${id}`, {
      hostname: "any",
      event: "teste:event",
      auto: mode.NO_AUTO,
    });

    const { result, waitForValueToChange } = renderHook(
      () =>
        useEvents(
          {},
          (err?: Error, data?: any) => {
            expect(err).toBeUndefined();

            expect(data).not.toBeNull();
            expect(data).not.toBeUndefined();
            done = true;
          },
          []
        ),
      {
        wrapper: ({ children }) =>
          React.createElement(React.Suspense, {
            fallback: "",
            children,
          }),
      }
    );

    await result.current;

    act(() => result.current());

    await waitForValueToChange(() => done);

    expect(done).toBeTruthy();
  });
});
