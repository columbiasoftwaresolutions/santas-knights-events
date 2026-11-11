import { describe, expect, it } from "vitest";

import { classifyDiscipline } from "./taxonomy";

describe("classifyDiscipline", () => {
  it("recognizes the disciplines we list", () => {
    expect(classifyDiscipline("Kid's Karate")).toBe("karate");
    expect(classifyDiscipline("Youth Boxing Fitness")).toBe("boxing");
    expect(classifyDiscipline("Tai Chi for Beginners")).toBe("tai-chi");
    expect(classifyDiscipline("Brazilian Jiu-Jitsu drop-in")).toBe("brazilian-jiu-jitsu");
    expect(classifyDiscipline("Women's Medieval Combat & Fitness")).toBe("medieval-combat");
  });

  it("prefers the specific style", () => {
    expect(classifyDiscipline("Chelsea Cardio Kickboxing")).toBe("kickboxing");
    expect(classifyDiscipline("Striking: Boxing and Kickboxing")).toBe("kickboxing");
  });

  it("does not match inside other words", () => {
    expect(classifyDiscipline("Filmmaking workshop")).toBeNull();
    expect(classifyDiscipline("Shadowboxing with Jessie")).toBeNull();
    expect(classifyDiscipline("Zumba")).toBeNull();
  });
});
