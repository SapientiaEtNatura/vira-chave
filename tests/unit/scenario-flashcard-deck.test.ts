import { describe, expect, it } from "vitest";
import type { QuizQuestionItem } from "@/components/discovery/DiscoveryQuizClient";
import {
  clampDeckIndex,
  getDeckNavigationState,
  getVisibleDeckSlice,
} from "@/components/discovery/ScenarioFlashcardDeck";

const MOCK_QUESTIONS: QuizQuestionItem[] = [
  {
    id: "q-01",
    order: 1,
    prompt: "Cenário 1",
    options: [
      { id: "a", label: "Opção A" },
      { id: "b", label: "Opção B" },
    ],
  },
  {
    id: "q-02",
    order: 2,
    prompt: "Cenário 2",
    options: [
      { id: "a", label: "Opção A" },
      { id: "b", label: "Opção B" },
    ],
  },
  {
    id: "q-03",
    order: 3,
    prompt: "Cenário 3",
    options: [
      { id: "a", label: "Opção A" },
      { id: "b", label: "Opção B" },
    ],
  },
  {
    id: "q-04",
    order: 4,
    prompt: "Cenário 4",
    options: [
      { id: "a", label: "Opção A" },
      { id: "b", label: "Opção B" },
    ],
  },
];

describe("ScenarioFlashcardDeck helpers", () => {
  it("clamps deck indices safely within bounds", () => {
    expect(clampDeckIndex(-2, 4)).toBe(0);
    expect(clampDeckIndex(99, 4)).toBe(3);
    expect(clampDeckIndex(1, 0)).toBe(0);
  });

  it("slices up to 3 stacked cards and shrinks peeking layers near the end", () => {
    const start = getVisibleDeckSlice(MOCK_QUESTIONS, 0);
    expect(start.index).toBe(0);
    expect(start.front?.id).toBe("q-01");
    expect(start.mid?.id).toBe("q-02");
    expect(start.back?.id).toBe("q-03");

    const penultimate = getVisibleDeckSlice(MOCK_QUESTIONS, 2);
    expect(penultimate.front?.id).toBe("q-03");
    expect(penultimate.mid?.id).toBe("q-04");
    expect(penultimate.back).toBeNull();

    const last = getVisibleDeckSlice(MOCK_QUESTIONS, 3);
    expect(last.front?.id).toBe("q-04");
    expect(last.mid).toBeNull();
    expect(last.back).toBeNull();

    const empty = getVisibleDeckSlice([], 0);
    expect(empty).toEqual({ index: 0, front: null, mid: null, back: null });
  });

  it("enforces explicit confirmation before advancing and allows going back after card 0", () => {
    const unansweredFirst = getDeckNavigationState(MOCK_QUESTIONS, {}, 0);
    expect(unansweredFirst.canGoBack).toBe(false);
    expect(unansweredFirst.canAdvance).toBe(false);
    expect(unansweredFirst.isLastCard).toBe(false);

    const answeredFirst = getDeckNavigationState(
      MOCK_QUESTIONS,
      { "q-01": "a" },
      0,
    );
    expect(answeredFirst.canGoBack).toBe(false);
    expect(answeredFirst.canAdvance).toBe(true);
    expect(answeredFirst.selectedOptionId).toBe("a");

    const answeredLast = getDeckNavigationState(
      MOCK_QUESTIONS,
      { "q-04": "b" },
      3,
    );
    expect(answeredLast.canGoBack).toBe(true);
    expect(answeredLast.canAdvance).toBe(true);
    expect(answeredLast.isLastCard).toBe(true);
  });
});
