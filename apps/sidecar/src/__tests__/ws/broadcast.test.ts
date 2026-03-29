import { describe, it, expect, beforeEach } from "bun:test";
import { Broadcaster } from "../../ws/broadcast";
import { ScreenRole } from "@castlight/shared";

function createMockIO() {
  const emissions: { room: string; event: string; data: any }[] = [];
  return {
    emissions,
    to(room: string) {
      return {
        emit(event: string, ...args: any[]) {
          emissions.push({ room, event, data: args[0] });
        },
      };
    },
    emit(event: string, ...args: any[]) {
      emissions.push({ room: "__all__", event, data: args[0] });
    },
  };
}

describe("Broadcaster", () => {
  let mockIO: ReturnType<typeof createMockIO>;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    mockIO = createMockIO();
    broadcaster = new Broadcaster(mockIO as any);
  });

  it("broadcasts to a specific role", () => {
    broadcaster.toRole(ScreenRole.Public, "content:lyrics", { section: { text: "Hello" } } as any);
    expect(mockIO.emissions).toHaveLength(1);
    expect(mockIO.emissions[0].room).toBe("role:public");
    expect(mockIO.emissions[0].event).toBe("content:lyrics");
  });

  it("broadcasts to all screens", () => {
    broadcaster.toAll("screens:updated", [] as any);
    expect(mockIO.emissions).toHaveLength(1);
    expect(mockIO.emissions[0].room).toBe("__all__");
  });

  it("broadcasts to multiple roles", () => {
    broadcaster.toRoles([ScreenRole.Public, ScreenRole.Stage], "content:bible", { text: "verse" } as any);
    expect(mockIO.emissions).toHaveLength(2);
    expect(mockIO.emissions[0].room).toBe("role:public");
    expect(mockIO.emissions[1].room).toBe("role:stage");
  });
});
